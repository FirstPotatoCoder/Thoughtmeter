import { useEffect, useState } from "react";
import "./McqPreview.css";

const BARS = [
  { label: "Option", color: "#6B7AE6" },
  { label: "Option", color: "#E8695F" },
  { label: "Option", color: "#3C4580" },
];

const INITIAL_COUNTS = [5, 7, 6];

// Tallest bar uses up to this % of the available area so the
// count label above it always fits.
const MAX_HEIGHT_PCT = 78;
const MIN_COUNT = 1;
const MAX_COUNT = 9;

export default function McqPreview() {
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  // Bars render at 0 height first, then "grow" on the next frame so the
  // CSS transition animates them up. Count labels are positioned from
  // `counts` immediately, so they never move during the initial grow.
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setGrown(true))
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  // Nudge the values slightly every 1–2 seconds.
  useEffect(() => {
    let timeout;
    const tick = () => {
      setCounts((prev) =>
        prev.map((v) => {
          const delta = [-1, 0, 1][Math.floor(Math.random() * 3)];
          return Math.min(MAX_COUNT, Math.max(MIN_COUNT, v + delta));
        })
      );
      timeout = setTimeout(tick, 1000 + Math.random() * 1000);
    };
    timeout = setTimeout(tick, 1000 + Math.random() * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const maxCount = Math.max(...counts);

  return (
    <div className="mcq-preview">
      {BARS.map((bar, index) => {
        const targetPct = (counts[index] / maxCount) * MAX_HEIGHT_PCT;
        const barPct = grown ? targetPct : 0;
        return (
          <div className="mcq-bar-col" key={index}>
            <div className="mcq-bar-area">
              <div
                className="mcq-preview-bar"
                style={{ height: `${barPct}%`, background: bar.color }}
              />
              <span
                className="mcq-preview-count"
                style={{ bottom: `calc(${targetPct}% + 10px)` }}
              >
                {counts[index]}
              </span>
            </div>
            <span className="mcq-preview-label">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}
