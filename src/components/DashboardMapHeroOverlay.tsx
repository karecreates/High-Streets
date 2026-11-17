import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import betaLogoWhite from "@assets/Beta_Logo_white.svg";
import { useMapZoom } from "../hooks/useMapZoom";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const DISCLAIMER =
  "©2026 Beta Agency, Inc. The information contained in this document (or provided verbally) has been obtained from sources believed reliable. While Beta Agency Inc. does not doubt its accuracy, Beta Agency Inc. has not verified it and makes no guarantee warranty or representation about it. It is your responsibility to independently confirm its accuracy. Any projections, opinions, assumptions or estimates used are for example only and do not represent the current or future performance of the property. The value of this transaction to you depends on tax and other factors which hold be evaluated by your tax, financial and legal advisors. You and your advisors should conduct a careful, independent investigation of the property to determine to your satisfaction the suitability of the property meet your needs.";

/** Ignore sub-level jitter from fitBounds / fractional zoom. */
const FADE_START = 0.12;
/** Fully gone after this much zoom-in from the overview camera. */
const FADE_SPAN = 1.15;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Bottom gradient + title + disclaimer on the dashboard overview map.
 * Captures the fitted overview zoom, then fades out as the user zooms in.
 */
export function DashboardMapHeroOverlay({
  locked = false,
  onReady,
}: {
  /** PDF cover: always fully visible, no zoom fade. */
  locked?: boolean;
  onReady?: () => void;
} = {}) {
  const map = useMap();
  const zoom = useMapZoom();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [baselineZoom, setBaselineZoom] = useState<number | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!map) return;
    const mapDiv = map.getDiv();
    setHost(
      mapDiv.closest<HTMLElement>(".dashboard-overview-map") ?? mapDiv
    );

    const listener = map.addListener("idle", () => {
      const next = map.getZoom();
      if (next == null) return;
      setBaselineZoom((current) => current ?? next);
    });
    return () => listener.remove();
  }, [map]);

  if (!host) return null;

  const opacity = locked
    ? 1
    : baselineZoom == null || zoom == null
      ? 1
      : clamp01(1 - (zoom - baselineZoom - FADE_START) / FADE_SPAN);
  const hidden = !locked && opacity < 0.02;

  return createPortal(
    <div
      className="dashboard-map-hero"
      style={{
        opacity: hidden ? 0 : opacity,
        transition: prefersReducedMotion ? "none" : "opacity 0.4s ease",
        visibility: hidden ? "hidden" : "visible",
      }}
      aria-hidden={hidden}
    >
      <div className="dashboard-map-hero__copy">
        <p className="dashboard-map-hero__title">
          <span className="dashboard-map-hero__city">Los Angeles</span>
          <span className="dashboard-map-hero__product">High Streets</span>
        </p>
        <p className="dashboard-map-hero__disclaimer">{DISCLAIMER}</p>
      </div>
      <img
        className="dashboard-map-hero__logo"
        src={betaLogoWhite}
        alt=""
        onLoad={() => onReady?.()}
        onError={() => onReady?.()}
      />
    </div>,
    host
  );
}
