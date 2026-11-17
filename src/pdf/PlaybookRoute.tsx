import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardOverviewMap } from "../components/DashboardOverviewMap";
import { getCorridorBySlug, getCorridorDetail } from "../data/highStreets";
import { ShoppingCenterMapPage } from "../pages/ShoppingCenterMapPage";
import { StreetDetailPage } from "../pages/StreetDetailPage";
import { StreetMapPage } from "../pages/StreetMapPage";
import { enableThrottledLogoRetries } from "../utils/logoProvider";
import {
  buildPlaybookPages,
  getExportableLocation,
  parseSelectionParam,
  type PlaybookPage,
} from "./playbookSpec";
import { useFitToPage } from "./useFitToPage";
import { markPlaybookError, usePlaybookReady } from "./usePlaybookReady";

declare global {
  interface Window {
    /** Page manifest, read by the exporter to know what to capture. */
    __PLAYBOOK__?: {
      pages: PlaybookPage[];
      pageCount: number;
    };
    /**
     * Advances pages without a reload so the in-memory brand logo cache is
     * shared across the booklet. Only safe between non-map pages.
     */
    __PLAYBOOK_GOTO__?: (pageIndex: number) => void;
  }
}

function PlaybookError({ message }: { message: string }) {
  useEffect(() => {
    markPlaybookError(message);
  }, [message]);

  return (
    <div className="playbook-page playbook-page--error">
      <h1>Booklet page could not be rendered</h1>
      <p>{message}</p>
    </div>
  );
}

function MasterMapPageView() {
  const [mapReady, setMapReady] = useState(false);
  const handleReady = useCallback(() => setMapReady(true), []);

  usePlaybookReady(mapReady);

  return (
    <div className="playbook-map-frame">
      <DashboardOverviewMap
        interactive={false}
        showBaseMapLabels
        onReady={handleReady}
      />
    </div>
  );
}

/** Full-bleed hero: the dashboard photo view without the sidebar or controls. */
function GalleryPageView({ slug }: { slug: string }) {
  const corridor = getCorridorBySlug(slug);
  const [imageLoaded, setImageLoaded] = useState(false);
  const missingImage = Boolean(corridor) && !corridor?.heroImage;

  usePlaybookReady(
    imageLoaded,
    missingImage ? `No hero image for "${slug}".` : null
  );

  if (!corridor) {
    return <PlaybookError message={`Unknown location "${slug}".`} />;
  }

  return (
    <div className="playbook-hero">
      {corridor.heroImage ? (
        <img
          className="playbook-hero__image"
          src={corridor.heroImage}
          alt={`${corridor.name}, ${corridor.city}`}
          style={
            corridor.heroObjectPosition
              ? { objectPosition: corridor.heroObjectPosition }
              : undefined
          }
          onLoad={() => setImageLoaded(true)}
          onError={() =>
            markPlaybookError(`Hero image failed to load for "${slug}".`)
          }
        />
      ) : null}
      <div className="hero-panel__gradient" />
      <div className="hero-panel__caption">
        <h2 className="hero-panel__name">{corridor.name.toUpperCase()}</h2>
        <p className="hero-panel__city">{corridor.city.toUpperCase()}</p>
      </div>
    </div>
  );
}

function OverviewPageView({ slug }: { slug: string }) {
  const detail = getCorridorDetail(slug);
  const { rootRef, fitted } = useFitToPage(
    Boolean(detail),
    ".street-detail__stack"
  );
  usePlaybookReady(fitted, detail ? null : `No overview content for "${slug}".`);

  if (!detail) {
    return <PlaybookError message={`No overview content for "${slug}".`} />;
  }

  return (
    <div className="playbook-fit" ref={rootRef}>
      <StreetDetailPage slug={slug} pdfMode />
    </div>
  );
}

function LocationMapPageView({ slug }: { slug: string }) {
  const location = getExportableLocation(slug);
  const [mapReady, setMapReady] = useState(false);
  const handleReady = useCallback(() => setMapReady(true), []);

  usePlaybookReady(
    mapReady,
    location ? null : `Location "${slug}" is not exportable.`
  );

  if (!location) {
    return <PlaybookError message={`Location "${slug}" is not exportable.`} />;
  }

  // High streets plot tenants; shopping centers reveal them through the popup.
  if (location.type === "shopping-center") {
    return <ShoppingCenterMapPage pdf={{ slug, onReady: handleReady }} />;
  }

  return <StreetMapPage pdf={{ slug, onReady: handleReady }} />;
}

/**
 * Internal booklet renderer: one US Letter landscape page per navigation.
 *
 * A single long document would mount a Google Map per location and exhaust
 * WebGL contexts, so the exporter walks `?page=N` instead and waits for the
 * `data-pdf-ready` signal each time.
 */
export function PlaybookRoute() {
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("playbook-mode");
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const slugsParam = searchParams.get("slugs");
  const pageParam = searchParams.get("page") ?? "0";

  const slugs = useMemo(() => parseSelectionParam(slugsParam), [slugsParam]);
  const pages = useMemo(() => buildPlaybookPages(slugs), [slugs]);

  useEffect(() => {
    window.__PLAYBOOK__ = { pages, pageCount: pages.length };
  }, [pages]);

  useEffect(() => {
    window.__PLAYBOOK_GOTO__ = (pageIndex: number) => {
      document.documentElement.removeAttribute("data-pdf-ready");
      document.documentElement.removeAttribute("data-pdf-error");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(pageIndex));
          return next;
        },
        { replace: true }
      );
    };
    return () => {
      delete window.__PLAYBOOK_GOTO__;
    };
  }, [setSearchParams]);

  useEffect(() => {
    document.documentElement.classList.add("playbook-mode");
    enableThrottledLogoRetries();
    return () => document.documentElement.classList.remove("playbook-mode");
  }, []);

  const pageIndex = Number.parseInt(pageParam, 10);
  const page = Number.isFinite(pageIndex) ? pages[pageIndex] : undefined;

  if (!slugs.length) {
    return <PlaybookError message="No locations were selected for export." />;
  }

  if (!page) {
    return (
      <PlaybookError
        message={`Page ${pageParam} is out of range (${pages.length} pages).`}
      />
    );
  }

  return (
    <div
      // Remount on every page so no view state leaks between booklet pages.
      key={page.index}
      className="playbook-page"
      data-page-index={page.index}
      data-page-kind={page.kind}
      data-page-slug={page.slug ?? ""}
    >
      {page.kind === "master-map" ? <MasterMapPageView /> : null}
      {page.kind === "gallery" && page.slug ? (
        <GalleryPageView slug={page.slug} />
      ) : null}
      {page.kind === "overview" && page.slug ? (
        <OverviewPageView slug={page.slug} />
      ) : null}
      {page.kind === "location-map" && page.slug ? (
        <LocationMapPageView slug={page.slug} />
      ) : null}
    </div>
  );
}
