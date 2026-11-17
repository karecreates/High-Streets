import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getExportableLocations,
  type PlaybookLocation,
} from "../pdf/playbookSpec";
import { captureInteractiveStreetMap } from "../pdf/captureInteractiveStreetMap";
import { captureOverviewPage } from "../pdf/captureOverviewPage";
import { captureCenterMapPage } from "../pdf/captureCenterMapPage";

type CaptureKind = "overview" | "street-map" | "center-map";

type ExportFailure = {
  slug: string;
  name: string;
  message: string;
};

type ExportStatus =
  | { phase: "idle" }
  | {
      phase: "running";
      current: number;
      total: number;
      label: string;
      failures: ExportFailure[];
    }
  | { phase: "error"; message: string; failures: ExportFailure[] }
  | { phase: "done"; pageCount: number; failures: ExportFailure[] };

const GROUPS: Array<{ type: PlaybookLocation["type"]; label: string }> = [
  { type: "high-street", label: "High Streets" },
  { type: "shopping-center", label: "Shopping Centers" },
];

/** Master map, then gallery + overview + map per location. */
function pageCountFor(selectedCount: number): number {
  return selectedCount === 0 ? 0 : 1 + selectedCount * 3;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "The export failed to run.";
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function requiredKinds(type: PlaybookLocation["type"]): CaptureKind[] {
  return type === "shopping-center"
    ? ["overview", "center-map"]
    : ["overview", "street-map"];
}

const KIND_LABEL: Record<CaptureKind, string> = {
  overview: "overview logos",
  "street-map": "map logos",
  "center-map": "directory logos",
};

function captureOnce(slug: string, kind: CaptureKind) {
  if (kind === "overview") return captureOverviewPage(slug);
  if (kind === "center-map") return captureCenterMapPage(slug);
  return captureInteractiveStreetMap(slug);
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isAbort(error)) throw error;
    return run();
  }
}

async function stageCapture(
  slug: string,
  kind: CaptureKind,
  overlay: unknown,
  signal: AbortSignal
) {
  const staged = await fetch("/api/export-booklet-overlay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, overlay, kind }),
    signal,
  });
  if (!staged.ok) {
    throw new Error(
      (await staged.text()) || `Could not store the ${slug} ${kind}.`
    );
  }
}

export function ExportBookletModal({ onClose }: { onClose: () => void }) {
  const locations = useMemo(() => getExportableLocations(), []);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<ExportStatus>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const running = status.phase === "running";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, running]);

  const pollRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (pollRef.current) window.clearInterval(pollRef.current);
    },
    []
  );

  const toggle = useCallback((slug: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(locations.map((location) => location.slug)));
  }, [locations]);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  /** Booklet order always follows the dashboard, not click order. */
  const orderedSlugs = useMemo(
    () =>
      locations
        .filter((location) => selected.has(location.slug))
        .map((location) => location.slug),
    [locations, selected]
  );

  const generate = useCallback(async () => {
    if (!orderedSlugs.length) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const jobs = orderedSlugs.flatMap((slug) => {
      const location = locations.find((item) => item.slug === slug);
      if (!location) return [];
      return requiredKinds(location.type).map((kind) => ({ slug, kind }));
    });
    const captureTotal = jobs.length;
    const assemblyEstimate = pageCountFor(orderedSlugs.length);
    const failures: ExportFailure[] = [];
    const exportSlugs: string[] = [];

    const report = (current: number, label: string) => {
      setStatus({
        phase: "running",
        current,
        total: captureTotal + assemblyEstimate,
        label,
        failures: [...failures],
      });
    };

    report(0, "Checking saved logos…");

    let ready: Record<string, CaptureKind[]> = {};
    try {
      const cacheResponse = await fetch(
        `/api/export-booklet-cache?slugs=${encodeURIComponent(orderedSlugs.join(","))}`,
        { signal: controller.signal }
      );
      if (cacheResponse.ok) {
        const body = (await cacheResponse.json()) as {
          ready?: Record<string, CaptureKind[]>;
        };
        ready = body.ready ?? {};
      }
    } catch (error) {
      if (isAbort(error)) return;
    }

    let step = 0;
    for (const slug of orderedSlugs) {
      const location = locations.find((item) => item.slug === slug);
      if (!location) continue;
      let failed = false;
      for (const kind of requiredKinds(location.type)) {
        if (controller.signal.aborted) return;
        step += 1;
        if (ready[slug]?.includes(kind)) {
          report(step, `${location.name} — using saved ${KIND_LABEL[kind]}`);
          continue;
        }
        report(step, `${location.name} — copying ${KIND_LABEL[kind]}`);
        try {
          await withRetry(async () => {
            const overlay = await captureOnce(slug, kind);
            if (controller.signal.aborted) return;
            await stageCapture(slug, kind, overlay, controller.signal);
          });
        } catch (error) {
          if (isAbort(error) || controller.signal.aborted) return;
          failed = true;
          failures.push({
            slug,
            name: location.name,
            message: `${KIND_LABEL[kind]} could not be copied. ${errorMessage(error)}`,
          });
          report(step, `${location.name} was left out`);
          break;
        }
      }
      if (!failed) exportSlugs.push(slug);
    }

    if (!exportSlugs.length) {
      setStatus({
        phase: "error",
        message: "No locations could be captured with their logos.",
        failures: [...failures],
      });
      return;
    }

    const assemblyTotal = pageCountFor(exportSlugs.length);
    report(captureTotal, "Assembling the PDF…");

    let sawAssembly = false;
    pollRef.current = window.setInterval(() => {
      void fetch("/api/export-booklet-progress")
        .then(async (progressResponse) => {
          if (!progressResponse.ok) return null;
          return (await progressResponse.json()) as {
            phase?: string;
            current?: number;
            total?: number;
            label?: string;
            failures?: string[];
          };
        })
        .then((data) => {
          if (!data) return;
          if (data.phase === "assembling") sawAssembly = true;
          if (!sawAssembly || data.phase !== "assembling") return;
          const assemblyFailures: ExportFailure[] = (data.failures ?? []).map(
            (message) => ({ slug: "", name: "PDF", message })
          );
          setStatus({
            phase: "running",
            current: captureTotal + (data.current ?? 0),
            total: captureTotal + (data.total || assemblyTotal),
            label: data.label
              ? `Assembling PDF — ${data.label}`
              : "Assembling the PDF…",
            failures: [...failures, ...assemblyFailures],
          });
        })
        .catch(() => undefined);
    }, 700);

    try {
      const response = await fetch("/api/export-booklet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: exportSlugs }),
        signal: controller.signal,
      });
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;

      if (!response.ok) {
        throw new Error(
          (await response.text()) || `Export failed (${response.status}).`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "High-Streets-Booklet.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

      const headerPages = Number(response.headers.get("X-Booklet-Pages"));
      const pageCount =
        Number.isFinite(headerPages) && headerPages > 0
          ? headerPages
          : pageCountFor(exportSlugs.length);

      let assemblyFailures: ExportFailure[] = [];
      try {
        const progressResponse = await fetch("/api/export-booklet-progress");
        if (progressResponse.ok) {
          const data = (await progressResponse.json()) as {
            failures?: string[];
          };
          assemblyFailures = (data.failures ?? []).map((message) => ({
            slug: "",
            name: "PDF",
            message,
          }));
        }
      } catch {
        assemblyFailures = [];
      }

      setStatus({
        phase: "done",
        pageCount,
        failures: [...failures, ...assemblyFailures],
      });
    } catch (error) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      if (isAbort(error) || controller.signal.aborted) return;
      setStatus({
        phase: "error",
        message: errorMessage(error),
        failures: [...failures],
      });
    }
  }, [locations, orderedSlugs]);

  return (
    <div
      className={`export-booklet${running ? " export-booklet--running" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-booklet-title"
      onClick={running ? undefined : onClose}
    >
      <div
        className="export-booklet__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="export-booklet__header">
          <div>
            <h2 id="export-booklet-title" className="export-booklet__title">
              Export Booklet
            </h2>
            <p className="export-booklet__subtitle">
              Choose the locations to include. Logos are copied from this
              browser, then the booklet is built in the background.
            </p>
          </div>
          <button
            type="button"
            className="export-booklet__close"
            onClick={onClose}
            disabled={running}
            aria-label="Close export panel"
          >
            ×
          </button>
        </header>

        <div className="export-booklet__toolbar">
          <div className="export-booklet__toolbar-actions">
            <button type="button" onClick={selectAll} disabled={running}>
              Select all
            </button>
            <button type="button" onClick={clearAll} disabled={running}>
              Clear all
            </button>
          </div>
          <p className="export-booklet__count">
            {selected.size} selected · {pageCountFor(selected.size)} pages
          </p>
        </div>

        <div className="export-booklet__groups">
          {GROUPS.map((group) => {
            const items = locations.filter(
              (location) => location.type === group.type
            );
            if (!items.length) return null;

            return (
              <section key={group.type} className="export-booklet__group">
                <h3 className="export-booklet__group-title">{group.label}</h3>
                <ul className="export-booklet__list">
                  {items.map((location) => (
                    <li key={location.slug}>
                      <label className="export-booklet__option">
                        <input
                          type="checkbox"
                          checked={selected.has(location.slug)}
                          onChange={() => toggle(location.slug)}
                          disabled={running}
                        />
                        <span className="export-booklet__option-name">
                          {location.name}
                        </span>
                        <span className="export-booklet__option-city">
                          {location.city}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="export-booklet__footer">
          {status.phase === "running" || status.phase === "done" ? (
            <div className="export-booklet__progress">
              <div
                className="export-booklet__progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={status.phase === "running" ? status.total : 100}
                aria-valuenow={
                  status.phase === "running" ? status.current : status.pageCount
                }
                aria-label={
                  status.phase === "running" ? status.label : "Export complete"
                }
              >
                <div
                  className="export-booklet__progress-bar"
                  style={{
                    width:
                      status.phase === "done"
                        ? "100%"
                        : `${status.total > 0 ? Math.min(100, (status.current / status.total) * 100) : 0}%`,
                  }}
                />
              </div>
              {status.failures.length ? (
                <ul className="export-booklet__failures">
                  {status.failures.map((failure, index) => (
                    <li key={`${failure.slug}-${index}`}>
                      {failure.name}: {failure.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {status.phase === "error" && status.failures.length ? (
            <ul className="export-booklet__failures">
              {status.failures.map((failure, index) => (
                <li key={`${failure.slug}-${index}`}>
                  {failure.name}: {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="export-booklet__footer-row">
            <p
              className={`export-booklet__status${
                status.phase === "error" ? " export-booklet__status--error" : ""
              }`}
              role="status"
            >
              {status.phase === "running"
                ? `${status.label} (${status.current} / ${status.total})`
                : status.phase === "error"
                  ? status.message
                  : status.phase === "done"
                    ? `Downloaded High-Streets-Booklet.pdf (${status.pageCount} pages)${
                        status.failures.length
                          ? `. ${status.failures.length} left out.`
                          : "."
                      }`
                    : "Pages are 17 × 11 in landscape, print ready."}
            </p>
            <button
              type="button"
              className="pill-btn pill-btn--primary"
              onClick={generate}
              disabled={running || selected.size === 0}
            >
              {running ? "Generating…" : "Generate PDF"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
