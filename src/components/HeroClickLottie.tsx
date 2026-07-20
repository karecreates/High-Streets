const LOTTIE_SRC =
  "https://lottie.host/33b1ccbb-9dfc-468b-adb6-351069ccb0e6/6Ih9ePUz47.lottie";

/** Original embed is 300×300 — scale the whole canvas down uniformly. */
const LOTTIE_NATIVE_PX = 300;
const LOTTIE_DISPLAY_PX = 80;

export function HeroClickLottie() {
  return (
    <div className="hero-panel__cta" aria-hidden>
      <div className="hero-panel__cta-pill">
        <div className="hero-panel__cta-content">
          <div
            className="hero-panel__cta-lottie-wrap"
            style={{ width: LOTTIE_DISPLAY_PX, height: LOTTIE_DISPLAY_PX }}
          >
            <div className="hero-panel__cta-lottie-scaler">
              <dotlottie-wc
                src={LOTTIE_SRC}
                autoplay
                loop
                className="hero-panel__cta-lottie"
                style={{
                  width: `${LOTTIE_NATIVE_PX}px`,
                  height: `${LOTTIE_NATIVE_PX}px`,
                }}
              />
            </div>
          </div>
          <span className="hero-panel__cta-text">Click here</span>
        </div>
      </div>
    </div>
  );
}
