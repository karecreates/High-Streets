import type { LACountyParkingLotProperties } from "../types/lacountyParkingLots";

interface ParkingLotInfoWindowContentProps {
  lot: LACountyParkingLotProperties;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function formatAreaSqFt(value: number | null): string {
  if (value == null || value <= 0) return "";
  return `${Math.round(value).toLocaleString("en-US")} sq ft`;
}

export function ParkingLotInfoWindowContent({
  lot,
}: ParkingLotInfoWindowContentProps) {
  const areaLabel = formatAreaSqFt(lot.areaSqFt);

  return (
    <article className="info-window info-window--parking">
      <header className="info-window__header">
        <span className="info-window__parking-lot-badge" aria-hidden>
          PARKING LOT
        </span>
        <div>
          <h2 className="info-window__title">Parking lot</h2>
          <span className="info-window__badge info-window__badge--parking">
            LA County LARIAC 2014
          </span>
        </div>
      </header>

      <dl className="info-window__details">
        <DetailRow label="Parcel / APN" value={lot.ain} />
        <DetailRow label="Lot area" value={areaLabel} />
        <DetailRow label="Use type" value={lot.useType} />
        <DetailRow label="Land use" value={lot.useDescription} />
      </dl>

      <p className="info-window__footnote">
        Reference layer only. LA County parking lot boundaries (5,000+ sq ft,
        commercial/industrial/government) from 2014 LARIAC imagery — not live
        availability.
      </p>
    </article>
  );
}
