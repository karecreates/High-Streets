import betaLogoSrc from "@assets/Beta_Logo_white.svg";

export const BETA_CONTACT_URL = "https://www.betaagency.com/contact";

export function BetaContactCta() {
  return (
    <div className="info-window__contact">
      <p className="info-window__contact-lead">
        Interested in leasing this space?
      </p>
      <a
        className="info-window__contact-btn"
        href={BETA_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={betaLogoSrc}
          alt="beta"
          className="info-window__contact-logo"
        />
        <span className="info-window__contact-btn-text">Contact Beta</span>
      </a>
    </div>
  );
}
