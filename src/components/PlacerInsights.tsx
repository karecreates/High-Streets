import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import placerLogo from "@assets/logos/placer_logo_ai402x-onc6yw63cdv2bi8m8eps8fr1sczb4qf1x8fx55sc2o.png";
import type { PlacerInsightsData, PlacerStat } from "../data/placer/types";
import { AnimatedDisplay } from "./AnimatedDisplay";
import { PlacerTradeAreaMap } from "./PlacerTradeAreaMap";

type TabId = "overview" | "demographics" | "psychographics" | "trade-area";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "trade-area", label: "Trade Area" },
  { id: "demographics", label: "Demographics" },
  { id: "psychographics", label: "Psychographics" },
];

function StatTiles({
  stats,
  large = false,
  animateFrom = 0,
}: {
  stats: PlacerStat[];
  large?: boolean;
  animateFrom?: number;
}) {
  return (
    <ul
      className={`placer-stats ${large ? "placer-stats--headline" : "placer-stats--secondary"}`}
    >
      {stats.map((stat, index) => (
        <li key={stat.label} className="placer-stats__item">
          <AnimatedDisplay
            className="placer-stats__value"
            value={stat.value}
            delay={animateFrom + index * 120}
            duration={1100}
          />
          <span className="placer-stats__label">{stat.label}</span>
          {stat.hint ? (
            <span className="placer-stats__hint">{stat.hint}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function OverviewTab({ data }: { data: PlacerInsightsData }) {
  return (
    <div className="placer-tabpanel__inner placer-tabpanel__inner--overview">
      <div className="placer-bento">
        <ul className="placer-bento__hero">
          {data.overview.headline.map((stat, index) => (
            <li key={stat.label} className="placer-bento__tile placer-bento__tile--hero">
              <AnimatedDisplay
                className="placer-bento__value"
                value={stat.value}
                delay={index * 120}
                duration={1100}
              />
              <span className="placer-bento__label">{stat.label}</span>
            </li>
          ))}
        </ul>
        {data.overview.secondary.length ? (
          <ul className="placer-bento__secondary">
            {data.overview.secondary.map((stat, index) => (
              <li
                key={stat.label}
                className="placer-bento__tile placer-bento__tile--secondary"
              >
                <AnimatedDisplay
                  className="placer-bento__value"
                  value={stat.value}
                  delay={360 + index * 100}
                  duration={1100}
                />
                <span className="placer-bento__label">{stat.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function DemographicsTab({ data }: { data: PlacerInsightsData }) {
  const { stats, income, workplace } = data.demographics;
  const incomeStats: PlacerStat[] = [
    { value: income.average, label: "Average household income" },
    { value: income.median, label: "Median household income" },
  ];

  return (
    <div className="placer-tabpanel__inner placer-tabpanel__inner--demo">
      <StatTiles stats={stats} />

      <div className="placer-columns">
        <section className="placer-section" aria-label="Workplace">
          <h4 className="placer-section__title">Workplace</h4>
          <StatTiles stats={workplace} />
        </section>

        <section className="placer-section" aria-label="Household income">
          <h4 className="placer-section__title">Household income</h4>
          <StatTiles stats={incomeStats} />
        </section>
      </div>
    </div>
  );
}

function PsychographicsTab({ data }: { data: PlacerInsightsData }) {
  return (
    <div className="placer-tabpanel__inner placer-tabpanel__inner--psycho">
      <p className="placer-note">
        Top Experian Mosaic groups by trade-area population.
      </p>
      <ol className="placer-psycho">
        {data.psychographics.topGroups.map((group, index) => (
          <li key={group.code} className="placer-psycho__card">
            <div className="placer-psycho__rank" aria-hidden>
              {index + 1}
            </div>
            <div className="placer-psycho__body">
              <div className="placer-psycho__head">
                <h4 className="placer-psycho__name">{group.name}</h4>
                <span
                  className="placer-psycho__index"
                  title={`Indexes at ${group.index} vs. a nationwide benchmark of 100`}
                >
                  {group.index}× index
                </span>
              </div>
              <div className="placer-psycho__meter">
                <span
                  className="placer-psycho__meter-fill"
                  style={{ width: `${Math.min(group.percent, 100)}%` }}
                />
              </div>
              <p className="placer-psycho__figures">
                <strong>{group.percent}%</strong> of population
                {group.population && group.population !== "—"
                  ? ` · ${group.population} people`
                  : null}
              </p>
            </div>
            {group.description ? (
              <span className="placer-psycho__tooltip" role="tooltip">
                {group.description}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TradeAreaTab({
  data,
  onExpand,
}: {
  data: PlacerInsightsData;
  onExpand: () => void;
}) {
  return (
    <div className="placer-tabpanel__inner placer-tabpanel__inner--trade">
      <div className="placer-trade-head">
        <p className="placer-note">{data.methodology}</p>
        <button
          type="button"
          className="placer-expand-btn"
          onClick={onExpand}
        >
          Expand map ↗
        </button>
      </div>
      <div className="placer-trade-map">
        <PlacerTradeAreaMap
          mapKey="placer-trade-area-inline"
          polygons={data.tradeArea.polygons}
          site={data.tradeArea.site}
          showLandmarks={false}
        />
      </div>
    </div>
  );
}

function TradeAreaModal({
  data,
  onClose,
}: {
  data: PlacerInsightsData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="placer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${data.placeName} trade area map`}
      onClick={onClose}
    >
      <div
        className="placer-modal__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="placer-modal__header">
          <div>
            <h3 className="placer-modal__title">
              {data.placeName} — True Trade Area
            </h3>
            <p className="placer-modal__subtitle">
              {data.methodology} {data.reportingPeriod}.
            </p>
          </div>
          <button
            type="button"
            className="placer-modal__close"
            onClick={onClose}
            aria-label="Close trade area map"
          >
            ✕
          </button>
        </header>
        <div className="placer-modal__map">
          <PlacerTradeAreaMap
            mapKey="placer-trade-area-modal"
            polygons={data.tradeArea.polygons}
            site={data.tradeArea.site}
            fitPadding={80}
            zoomInSteps={1}
            showLandmarks
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PlacerInsights({ data }: { data: PlacerInsightsData }) {
  const [activeTab, setActiveTab] = useState<TabId>("demographics");
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className="info-card placer-card">
      <div className="info-card__header placer-card__header">
        <span>TRADE AREA POLYGON* STATISTICS</span>
        <span
          className="placer-badge"
          title={`${data.methodology} ${data.reportingPeriod}.`}
        >
          Powered by Placer.ai
        </span>
      </div>

      <div
        className="placer-tabs"
        role="tablist"
        aria-label="Placer.ai trade area polygon statistics"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`placer-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`placer-panel-${tab.id}`}
            className={`placer-tabs__tab ${
              activeTab === tab.id ? "placer-tabs__tab--active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        key={activeTab}
        id={`placer-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`placer-tab-${activeTab}`}
        className="placer-tabpanel"
      >
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "demographics" && <DemographicsTab data={data} />}
        {activeTab === "psychographics" && <PsychographicsTab data={data} />}
        {activeTab === "trade-area" && (
          <TradeAreaTab data={data} onExpand={openModal} />
        )}
      </div>

      <footer className="placer-footnote">
        <p className="placer-footnote__text">
          {data.methodology} {data.reportingPeriod}.
        </p>
        <img
          className="placer-footnote__logo"
          src={placerLogo}
          alt="Placer.ai"
          title="Powered by Placer.ai"
        />
      </footer>

      {modalOpen ? <TradeAreaModal data={data} onClose={closeModal} /> : null}
    </div>
  );
}
