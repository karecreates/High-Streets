interface ParkingLayerTogglesProps {
  showMeteredParking: boolean;
  showParkingLots: boolean;
  onMeteredParkingChange: (enabled: boolean) => void;
  onParkingLotsChange: (enabled: boolean) => void;
  compact?: boolean;
}

export function ParkingLayerToggles({
  showMeteredParking,
  showParkingLots,
  onMeteredParkingChange,
  onParkingLotsChange,
  compact = false,
}: ParkingLayerTogglesProps) {
  return (
    <div
      className={`parking-toggles${compact ? " parking-toggles--compact" : ""}`}
      role="group"
      aria-label="Parking map layers"
    >
      <label className="parking-toggles__item">
        <input
          type="checkbox"
          checked={showMeteredParking}
          onChange={(event) => onMeteredParkingChange(event.target.checked)}
        />
        <span className="parking-toggles__label">
          <span className="parking-toggles__label-full">Metered Parking</span>
          <span className="parking-toggles__label-short">Meters</span>
        </span>
      </label>
      <label className="parking-toggles__item">
        <input
          type="checkbox"
          checked={showParkingLots}
          onChange={(event) => onParkingLotsChange(event.target.checked)}
        />
        <span className="parking-toggles__label">
          <span className="parking-toggles__label-full">Parking Lots</span>
          <span className="parking-toggles__label-short">Lots</span>
        </span>
      </label>
    </div>
  );
}
