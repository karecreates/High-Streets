import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const cacheFile = path.resolve("public/data/geocode-cache.json");
const betaLogoRoot = path.resolve("assets/Beta LOGOS");

const BETA_LOGO_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

/** Dev/preview only. Production copies public/beta-logos (a symlink) into dist. */
function betaLogosStatic() {
  const handler = (
    req: { url?: string },
    res: {
      setHeader: (name: string, value: string) => void;
      statusCode: number;
    },
    next: () => void
  ) => {
    try {
      const rel = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(
        /^\/+/,
        ""
      );
      const file = path.resolve(betaLogoRoot, rel);
      if (file !== betaLogoRoot && !file.startsWith(betaLogoRoot + path.sep)) {
        next();
        return;
      }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        next();
        return;
      }
      res.setHeader(
        "Content-Type",
        BETA_LOGO_TYPES[path.extname(file).toLowerCase()] ??
          "application/octet-stream"
      );
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(file).pipe(res as unknown as NodeJS.WritableStream);
    } catch {
      next();
    }
  };
  return {
    name: "beta-logos-static",
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use("/beta-logos", handler);
    },
    configurePreviewServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use("/beta-logos", handler);
    },
  };
}

function geocodeCacheApi() {
  return {
    name: "geocode-cache-api",
    configureServer(server) {
      server.middlewares.use("/api/geocode-cache", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            JSON.parse(body);
            fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
            fs.writeFileSync(cacheFile, body);
            res.statusCode = 200;
            res.end("ok");
          } catch {
            res.statusCode = 400;
            res.end("Invalid JSON");
          }
        });
      });
    },
  };
}

/**
 * Runs the Playwright booklet exporter against this same dev server and streams
 * the finished PDF back to the browser. Logo captures are stored on disk as
 * they arrive so a long export can resume, and assembly progress is readable
 * while Playwright is still walking pages.
 */
function bookletExportApi() {
  const disableTimeouts = (
    httpServer: {
      timeout: number;
      headersTimeout: number;
      requestTimeout: number;
    } | null
  ) => {
    if (!httpServer) return;
    httpServer.timeout = 0;
    httpServer.headersTimeout = 0;
    httpServer.requestTimeout = 0;
  };

  const readBody = (req: import("node:http").IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });

  const sendJson = (
    res: import("node:http").ServerResponse,
    status: number,
    body: unknown
  ) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  return {
    name: "booklet-export-api",
    configureServer(server) {
      disableTimeouts(server.httpServer);
      server.httpServer?.once("listening", () => {
        disableTimeouts(server.httpServer);
      });

      server.middlewares.use("/api/export-booklet-cache", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        const query = (req.url ?? "").split("?")[1] ?? "";
        const slugs = (new URLSearchParams(query).get("slugs") ?? "")
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean);
        import("./scripts/booklet-capture-store.mjs")
          .then(({ listReadyCaptures }) => {
            sendJson(res, 200, { ready: listReadyCaptures(slugs) });
          })
          .catch((error) => {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : "Cache lookup failed.");
          });
      });

      server.middlewares.use("/api/export-booklet-progress", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        import("./scripts/booklet-capture-store.mjs")
          .then(({ getExportProgress }) => {
            sendJson(res, 200, getExportProgress());
          })
          .catch((error) => {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : "Progress lookup failed.");
          });
      });

      server.middlewares.use("/api/export-booklet-overlay", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        readBody(req)
          .then(async (raw) => {
            const { slug, overlay, kind } = JSON.parse(raw);
            if (typeof slug !== "string" || !overlay) {
              res.statusCode = 400;
              res.end("Overlay payload was incomplete.");
              return;
            }
            const storedKind =
              kind === "overview" || kind === "center-map" ? kind : "street-map";
            const { writeCapture } = await import(
              "./scripts/booklet-capture-store.mjs"
            );
            writeCapture(storedKind, slug, overlay);
            res.statusCode = 200;
            res.end("ok");
          })
          .catch(() => {
            res.statusCode = 400;
            res.end("Invalid overlay JSON.");
          });
      });

      server.middlewares.use("/api/export-booklet", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        req.socket.setTimeout(0);
        res.setTimeout(0);

        readBody(req)
          .then(async (raw) => {
            const { slugs } = JSON.parse(raw || "{}");
            if (!Array.isArray(slugs) || slugs.length === 0) {
              res.statusCode = 400;
              res.end("Select at least one location to export.");
              return;
            }

            const store = await import("./scripts/booklet-capture-store.mjs");
            const {
              streetMapOverlays,
              overviewCaptures,
              centerMapCaptures,
            } = store.loadCapturesForExport(slugs);
            store.setExportProgress({
              phase: "assembling",
              current: 0,
              total: 0,
              label: "Starting the PDF…",
              failures: [],
            });

            const host = req.headers.host ?? "localhost:5173";
            const { exportBooklet } = await import(
              "./scripts/export-booklet.mjs"
            );
            const { bytes, pageCount, pageErrors } = await exportBooklet({
              slugs,
              baseUrl: `http://${host}`,
              streetMapOverlays,
              overviewCaptures,
              centerMapCaptures,
              onProgress: ({ current, total, label }) => {
                store.setExportProgress({
                  phase: "assembling",
                  current,
                  total,
                  label,
                });
                console.log(`[export-booklet] ${current}/${total} ${label}`);
              },
              onPageError: (message: string) => {
                const current = store.getExportProgress();
                store.setExportProgress({
                  failures: [...current.failures, message],
                });
              },
            });

            store.setExportProgress({
              phase: "done",
              current: pageCount,
              total: pageCount,
              label: "PDF ready",
              failures: pageErrors,
            });

            const pdfBytes = Buffer.from(bytes);
            const copyPath = path.resolve("tmp/last-booklet.pdf");
            fs.mkdirSync(path.dirname(copyPath), { recursive: true });
            fs.writeFileSync(copyPath, pdfBytes);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="High-Streets-Booklet.pdf"'
            );
            res.setHeader("X-Booklet-Pages", String(pageCount));
            res.setHeader("X-Booklet-Skipped", String(pageErrors.length));
            res.end(pdfBytes);
          })
          .catch((error) => {
            console.error("[export-booklet]", error);
            import("./scripts/booklet-capture-store.mjs")
              .then(({ getExportProgress, setExportProgress }) => {
                const current = getExportProgress();
                setExportProgress({
                  phase: "error",
                  label:
                    error instanceof Error
                      ? error.message
                      : "Booklet export failed.",
                  failures: current.failures,
                });
              })
              .catch(() => undefined);
            if (res.headersSent) return;
            res.statusCode = 500;
            res.end(
              error instanceof Error ? error.message : "Booklet export failed."
            );
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), geocodeCacheApi(), bookletExportApi(), betaLogosStatic()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "assets"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
