interface StaticModeChromeProps {
  staticMode: boolean;
  onEnter: () => void;
  onExit: () => void;
}

/** Enter / exit controls for screenshot-friendly static map mode. */
export function StaticModeChrome({
  staticMode,
  onEnter,
  onExit,
}: StaticModeChromeProps) {
  if (staticMode) {
    return (
      <button
        type="button"
        className="static-mode-exit"
        onClick={onExit}
        aria-label="Exit static mode"
      >
        Close
      </button>
    );
  }

  return (
    <button
      type="button"
      className="static-mode-enter"
      onClick={onEnter}
      aria-label="Enter static mode for screenshots"
    >
      Static Mode
    </button>
  );
}
