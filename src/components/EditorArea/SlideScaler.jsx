import { useEffect, useRef, useState } from "react";
import "./SlideScaler.css";

// Must match --slide-width / --slide-height in index.css.
const CANVAS_W = 1458;
const CANVAS_H = 820;
// Padding around the canvas inside the container.
const PAD = 40;

/**
 * Wraps a fixed-size slide canvas and scales it down (via CSS transform)
 * to fit its parent container. Never scales *up* past 1.0 so the canvas
 * always looks crisp on large displays.
 */
export default function SlideScaler({ children }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const availW = width - PAD * 2;
      const availH = height - PAD * 2;
      const s = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1);
      setScale(Math.max(s, 0.15)); // floor at 15% so it never vanishes
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="slide-scaler">
      <div
        className="slide-scaler-inner"
        style={{
          transform: `scale(${scale})`,
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        {children}
      </div>
    </div>
  );
}
