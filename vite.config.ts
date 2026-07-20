import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const cacheFile = path.resolve("public/data/geocode-cache.json");

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

export default defineConfig({
  plugins: [react(), geocodeCacheApi()],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "assets"),
    },
  },
});
