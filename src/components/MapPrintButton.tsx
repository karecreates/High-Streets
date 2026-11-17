import { useState, type RefObject } from "react";
import { downloadMapViewportPdf } from "../pdf/captureMapViewport";

interface MapPrintButtonProps {
  mapRef: RefObject<google.maps.Map | null>;
  mapId?: string;
  filename: string;
}

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The PDF couldn't be created.";
}

/** Downloads the current map view as a print-resolution PDF. */
export function MapPrintButton({ mapRef, mapId, filename }: MapPrintButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      type="button"
      className="map-print-btn"
      disabled={busy}
      aria-busy={busy}
      title={error ?? "Download this view as a high-resolution PDF"}
      onClick={() => {
        const map = mapRef.current;
        if (!map || busy) return;
        setBusy(true);
        setError(null);
        void downloadMapViewportPdf(map, {
          mapId,
          filename,
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
        })
          .catch((err: unknown) => setError(messageFrom(err)))
          .finally(() => setBusy(false));
      }}
    >
      {busy ? "Preparing PDF…" : error ? "Print failed" : "Print PDF"}
    </button>
  );
}
