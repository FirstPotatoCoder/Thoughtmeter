import { useEffect, useState, useMemo } from "react";
import { MCQ_COLORS } from "../../palette";
import "./McqPreview.css";

const DEFAULT_BARS = [
  { label: "Option", color: "#6B7AE6" },
  { label: "Option", color: "#E8695F" },
  { label: "Option", color: "#3C4580" },
];

const INITIAL_COUNTS = [5, 7, 6, 4, 3, 5];

// Tallest bar uses up to this % of the available area so the
// count label above it always fits.
const MAX_HEIGHT_PCT = 72;
const MIN_COUNT = 1;
const MAX_COUNT = 9;

export default function McqPreview({ options: propOptions }) {
  const bars = useMemo(() => {
    if (propOptions && propOptions.length > 0) {
      return propOptions.map((opt, i) => ({
        label: opt.label || 'Option',
        color: opt.color || MCQ_COLORS[i % MCQ_COLORS.length],
      }));
    }
    return DEFAULT_BARS;
  }, [propOptions]);

  const [counts, setCounts] = useState(() =>
    bars.map((_, i) => INITIAL_COUNTS[i % INITIAL_COUNTS.length])
  );

  useEffect(() => {
    setCounts(bars.map((_, i) => INITIAL_COUNTS[i % INITIAL_COUNTS.length]));
  }, [bars]);

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

  const maxCount = Math.max(...counts, 1);

  return (
    <div className={`mcq-preview ${bars.length > 4 ? "dense" : ""}`}>
      {bars.map((bar, index) => {
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
