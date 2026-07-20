import type { LADOTParkingProperties } from "../types/ladotParking";

interface ParkingInfoWindowContentProps {
  parking: LADOTParkingProperties;
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

export function ParkingInfoWindowContent({
  parking,
}: ParkingInfoWindowContentProps) {
  return (
    <article className="info-window info-window--parking">
      <header className="info-window__header">
        <span className="info-window__parking-badge" aria-hidden>
          P
        </span>
        <div>
          <h2 className="info-window__title">Metered parking</h2>
          <span className="info-window__badge info-window__badge--parking">
            City of Los Angeles (LADOT)
          </span>
        </div>
      </header>

      <dl className="info-window__details">
        <DetailRow label="Space ID" value={parking.spaceId} />
        <DetailRow label="Block / address" value={parking.blockface} />
        <DetailRow label="Time limit" value={parking.timeLimit} />
        <DetailRow label="Rate" value={parking.rateRange} />
        <DetailRow label="Rate type" value={parking.rateType} />
        <DetailRow label="Meter type" value={parking.meterType} />
      </dl>

      <p className="info-window__footnote">
        Hours and restrictions are not included in this LADOT open dataset.
      </p>
    </article>
  );
}
