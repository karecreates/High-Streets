interface MajorTenantsToggleProps {
  label?: string;
  active: boolean;
  filtering?: boolean;
  onChange: (active: boolean) => void;
}

export function MajorTenantsToggle({
  label = "Major Tenants",
  active,
  filtering = false,
  onChange,
}: MajorTenantsToggleProps) {
  return (
    <button
      type="button"
      className={`major-tenants-toggle${
        active ? " major-tenants-toggle--active" : ""
      }${filtering ? " major-tenants-toggle--filtering" : ""}`}
      aria-pressed={active}
      aria-busy={filtering || undefined}
      onClick={() => onChange(!active)}
    >
      {label}
    </button>
  );
}
