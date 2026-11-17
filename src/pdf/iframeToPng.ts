import { toPng } from "html-to-image";

declare global {
  interface Window {
    /** Loaded inside booklet capture iframes so blob: logos resolve. */
    __IFRAME_TO_PNG__?: typeof toPng;
  }
}

window.__IFRAME_TO_PNG__ = toPng;
