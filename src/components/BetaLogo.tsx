import betaLogoSrc from "@assets/Beta_Logo_color.svg";

export function BetaLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={betaLogoSrc}
      alt="beta"
      className={`beta-logo ${className}`.trim()}
    />
  );
}
