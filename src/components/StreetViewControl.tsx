import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import walkingPersonIcon from "@assets/walking-person-go-walk-move-svgrepo-com.svg";
import {
  clientPointToContainerPixel,
  createMapProjectionHelper,
  isPointerOverMap,
} from "../utils/mapPixelUtils";

const PEGMAN_SIZE_PX = 40;
const PEGMAN_CONTROL_GAP_PX = 10;
/** Fallback when Google’s bottom-right controls aren’t queryable yet. */
const FALLBACK_BOTTOM_PX = 24;
const FALLBACK_RIGHT_PX = 68;

function findBottomRightMapControl(mapDiv: HTMLElement): HTMLElement | null {
  const mapRect = mapDiv.getBoundingClientRect();
  const candidates = mapDiv.querySelectorAll<HTMLElement>(
    [
      "button.gm-fullscreen-control",
      'gmp-internal-camera-control button[aria-label="Map camera controls"]',
      'button[aria-label="Toggle fullscreen view"]',
      'button[title="Toggle fullscreen view"]',
      ".gm-bundled-control .gmnoprint button",
      'button[aria-label="Zoom in"]',
      'button[title="Zoom in"]',
    ].join(", ")
  );

  let anchor: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fromBottom = mapRect.bottom - rect.bottom;
    const fromRight = mapRect.right - rect.right;
    if (fromBottom < -4 || fromBottom > 160 || fromRight < -4 || fromRight > 80) {
      continue;
    }

    // Prefer the top-most control in the bottom-right stack (fullscreen / camera).
    const score = fromBottom * 2 + fromRight;
    if (score < bestScore) {
      bestScore = score;
      anchor = candidate;
    }
  }

  return anchor;
}

function applyFallbackDockPosition(dock: HTMLElement) {
  dock.style.left = "auto";
  dock.style.top = "auto";
  dock.style.right = `${FALLBACK_RIGHT_PX}px`;
  dock.style.bottom = `${FALLBACK_BOTTOM_PX}px`;
}

function syncStreetViewDockPosition(
  map: google.maps.Map,
  shell: HTMLElement,
  dock: HTMLElement
): boolean {
  const anchor = findBottomRightMapControl(map.getDiv());
  if (!anchor) {
    applyFallbackDockPosition(dock);
    return false;
  }

  const anchorRect = anchor.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();

  dock.style.left = `${anchorRect.left - shellRect.left - PEGMAN_SIZE_PX - PEGMAN_CONTROL_GAP_PX}px`;
  dock.style.top = `${anchorRect.top - shellRect.top}px`;
  dock.style.right = "auto";
  dock.style.bottom = "auto";

  return true;
}

function StreetViewPegmanIcon({ className }: { className?: string }) {
  return (
    <img
      src={walkingPersonIcon}
      alt=""
      className={className}
      width={40}
      height={40}
      draggable={false}
    />
  );
}

export function StreetViewControl() {
  const map = useMap();
  const streetViewLibrary = useMapsLibrary("streetView");
  const dockRef = useRef<HTMLDivElement>(null);
  const [shellTarget, setShellTarget] = useState<HTMLElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [overMap, setOverMap] = useState(false);
  const [inStreetView, setInStreetView] = useState(false);
  const [dropHint, setDropHint] = useState<string | null>(null);

  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const coverageLayerRef = useRef<google.maps.StreetViewCoverageLayer | null>(
    null
  );
  const projectionRef = useRef<Awaited<
    ReturnType<typeof createMapProjectionHelper>
  > | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!map) return;
    setShellTarget(
      map.getDiv().closest(
        ".map-shell, .dashboard-overview-map, .placer-trade-map, .placer-modal__map"
      ) as HTMLElement | null
    );
  }, [map]);

  useEffect(() => {
    if (!map || !shellTarget || !dockRef.current || inStreetView) return;

    const dock = dockRef.current;
    let raf = 0;

    const scheduleSync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        syncStreetViewDockPosition(map, shellTarget, dock);
      });
    };

    applyFallbackDockPosition(dock);
    scheduleSync();

    // Keep retrying briefly — Google injects zoom/fullscreen controls async.
    let attempts = 0;
    const retryInterval = window.setInterval(() => {
      attempts += 1;
      const docked = syncStreetViewDockPosition(map, shellTarget, dock);
      if (docked || attempts >= 40) {
        window.clearInterval(retryInterval);
      }
    }, 100);

    const resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(map.getDiv());
    resizeObserver.observe(shellTarget);

    const idleListener = map.addListener("idle", scheduleSync);
    window.addEventListener("resize", scheduleSync);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(retryInterval);
      resizeObserver.disconnect();
      idleListener.remove();
      window.removeEventListener("resize", scheduleSync);
    };
  }, [map, shellTarget, inStreetView]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    createMapProjectionHelper(map).then((helper) => {
      if (cancelled) {
        helper.dispose();
        return;
      }
      projectionRef.current = helper;
    });

    return () => {
      cancelled = true;
      projectionRef.current?.dispose();
      projectionRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map || !streetViewLibrary) return;

    const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
      visible: false,
      addressControl: false,
      linksControl: false,
      clickToGo: true,
      panControl: false,
      zoomControl: true,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
    };

    const panorama = new streetViewLibrary.StreetViewPanorama(
      map.getDiv(),
      streetViewOptions
    );

    map.setStreetView(panorama);
    panoramaRef.current = panorama;

    const coverageLayer = new streetViewLibrary.StreetViewCoverageLayer();
    coverageLayerRef.current = coverageLayer;

    const visibleListener = panorama.addListener("visible_changed", () => {
      if (panorama.getVisible()) {
        panorama.setOptions({
          addressControl: false,
          linksControl: false,
          clickToGo: true,
          panControl: false,
        });
      }
      setInStreetView(panorama.getVisible());
    });

    return () => {
      visibleListener.remove();
      coverageLayer.setMap(null);
      panorama.setVisible(false);
      map.setStreetView(null);
      panoramaRef.current = null;
      coverageLayerRef.current = null;
    };
  }, [map, streetViewLibrary]);

  const exitStreetView = useCallback(() => {
    panoramaRef.current?.setVisible(false);
    setInStreetView(false);
  }, []);

  const openStreetViewAt = useCallback(
    async (clientX: number, clientY: number) => {
      if (!map || !streetViewLibrary || !projectionRef.current) return false;

      const pixel = clientPointToContainerPixel(map, clientX, clientY);
      if (!pixel) return false;

      const latLng = projectionRef.current.fromContainerPixel(pixel.x, pixel.y);
      if (!latLng) return false;

      const service = new streetViewLibrary.StreetViewService();
      const result = await new Promise<{
        data: google.maps.StreetViewPanoramaData | null;
        status: google.maps.StreetViewStatus;
      }>((resolve) => {
        service.getPanorama(
          {
            location: latLng,
            radius: 80,
            preference: google.maps.StreetViewPreference.NEAREST,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data, status) =>
            resolve({
              data,
              status: status as google.maps.StreetViewStatus,
            })
        );
      });

      if (
        result.status !== google.maps.StreetViewStatus.OK ||
        !result.data?.location?.latLng ||
        !panoramaRef.current
      ) {
        return false;
      }

      const panorama = panoramaRef.current;
      panorama.setPosition(result.data.location.latLng);
      panorama.setPov({ heading: 0, pitch: 0 });
      panorama.setVisible(true);
      setInStreetView(true);
      return true;
    },
    [map, streetViewLibrary]
  );

  const finishDrag = useCallback(
    async (clientX: number, clientY: number) => {
      coverageLayerRef.current?.setMap(null);
      setDragging(false);
      setDragPosition(null);
      setOverMap(false);

      if (!map) {
        setDropHint(null);
        return;
      }

      if (!isPointerOverMap(map, clientX, clientY)) {
        setDropHint(null);
        return;
      }

      const opened = await openStreetViewAt(clientX, clientY);
      setDropHint(
        opened ? null : "Street View isn't available here. Try another spot."
      );
      if (opened) setDropHint(null);
      else window.setTimeout(() => setDropHint(null), 2200);
    },
    [map, openStreetViewAt]
  );

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      setDragPosition({
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      });
      if (map) {
        setOverMap(isPointerOverMap(map, event.clientX, event.clientY));
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      void finishDrag(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, finishDrag, map]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (inStreetView || !map) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
    coverageLayerRef.current?.setMap(map);
    setDragging(true);
    setDragPosition({
      x: event.clientX - dragOffsetRef.current.x,
      y: event.clientY - dragOffsetRef.current.y,
    });
    setDropHint(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  if (!map) return null;

  return (
    <>
      {shellTarget && !inStreetView
        ? createPortal(
            <div
              ref={dockRef}
              className="street-view-dock"
              aria-label="Street View"
            >
              <button
                type="button"
                className={`street-view-pegman${dragging ? " street-view-pegman--hidden" : ""}`}
                aria-label="Drag Pegman onto the map to open Street View"
                onPointerDown={startDrag}
              >
                <StreetViewPegmanIcon className="street-view-pegman__icon" />
              </button>
              {dropHint ? <p className="street-view-hint">{dropHint}</p> : null}
            </div>,
            shellTarget
          )
        : null}

      {shellTarget && inStreetView
        ? createPortal(
            <button
              type="button"
              className="street-view-exit"
              onClick={exitStreetView}
            >
              Map view
            </button>,
            shellTarget
          )
        : null}

      {shellTarget && dragging && dragPosition
        ? createPortal(
            <div
              className="street-view-pegman-drag"
              style={{
                transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(${overMap ? 1.08 : 1})`,
              }}
              aria-hidden
            >
              <StreetViewPegmanIcon className="street-view-pegman__icon" />
            </div>,
            shellTarget
          )
        : null}
    </>
  );
}
