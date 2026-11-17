/**
 * Booklet captures run in a real Chrome iframe so Brandfetch logos paint
 * the same way they do on the interactive map and dedicated pages.
 *
 * Overview pages can sit under the dashboard. Google Maps will not start
 * unless the street frame is actually on screen, so map captures stay
 * visible while the progress card floats in the corner.
 */
export function mountCaptureFrame(
  title: string,
  width: number,
  height: number,
  surface: "map" | "page" = "page"
): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.title = title;
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("allow", "fullscreen");
  Object.assign(frame.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${width}px`,
    height: `${height}px`,
    border: "0",
    pointerEvents: "none",
    background: "#fff",
    zIndex: surface === "map" ? "40" : "1",
  });
  document.body.appendChild(frame);
  return frame;
}
