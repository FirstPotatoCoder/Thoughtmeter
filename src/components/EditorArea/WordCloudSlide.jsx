import { useEffect, useRef, useState, useMemo } from "react";
import SlideCanvas from "./SlideCanvas";
import QuestionEditor from "../QuestionEditor/QuestionEditor";
import "./WordCloudSlide.css";

// ─────────────────────────────────────────────
// Data — easily replaceable with an endpoint
// ─────────────────────────────────────────────
export const DEFAULT_CLOUD_WORDS = [
  { id: "creative", text: "creative", size: 95, color: "#C1C8F2" },
  { id: "fast", text: "fast", size: 85, color: "#B8C1EC" },
  { id: "leader", text: "leader", size: 80, color: "#B8C1EC" },
  { id: "bold", text: "bold", size: 65, color: "#F0C8C6" },
  { id: "focus", text: "focus", size: 65, color: "#F0C8C6" },
  { id: "transpiration", text: "transpiration", size: 45, color: "#E0BDBD" },
  { id: "inspiration", text: "inspiration", size: 24, color: "#C1C8F2" },
];

function getWordCloudData() {
  return DEFAULT_CLOUD_WORDS;
}

// ─────────────────────────────────────────────
// Layout algorithm (pure functions)
// ─────────────────────────────────────────────
function checkCollision(r1, r2) {
  return !(
    r1.right < r2.left ||
    r1.left > r2.right ||
    r1.bottom < r2.top ||
    r1.top > r2.bottom
  );
}

function computeLayout(words) {
  if (words.length === 0) return [];

  const sorted = [...words].sort((a, b) => b.size - a.size);
  const placed = [];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const dTheta = 0.2;
  const a = 1.5;

  for (const w of sorted) {
    ctx.font = `500 ${w.size}px system-ui, sans-serif`;
    const metrics = ctx.measureText(w.text);

    const width = metrics.width + 12;
    const height = w.size + 6;

    let theta = 0;
    let x = 0;
    let y = 0;
    let rect = { left: 0, right: 0, top: 0, bottom: 0 };

    let collision = true;
    while (collision) {
      const r = a * theta;
      x = r * Math.cos(theta);
      y = r * Math.sin(theta) * 0.5;

      rect = {
        left: x - width / 2,
        right: x + width / 2,
        top: y - height / 2,
        bottom: y + height / 2,
      };

      collision = placed.some((p) => checkCollision(rect, p.rect));
      theta += dTheta;
    }

    placed.push({ ...w, x, y, rect, width, height });
  }

  const minX = Math.min(...placed.map((p) => p.rect.left));
  const maxX = Math.max(...placed.map((p) => p.rect.right));
  const minY = Math.min(...placed.map((p) => p.rect.top));
  const maxY = Math.max(...placed.map((p) => p.rect.bottom));

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return placed.map((p) => ({
    ...p,
    x: p.x - cx,
    y: p.y - cy,
  }));
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function WordCloudSlide({
  slide,
  onQuestionChange,
  onUpdateCloudWords,
}) {
  const [bodySelected, setBodySelected] = useState(false);
  const [cloudWords, setCloudWords] = useState(slide.cloudWords || []);
  const bodyRef = useRef(null);

  // Seed initial data when slide has none
  useEffect(() => {
    if (cloudWords.length === 0 && slide.cloudWords === undefined) {
      const initial = getWordCloudData();
      setCloudWords(initial);
      // Persist to the slide object so it's not lost on re-render
      onUpdateCloudWords?.(slide.id, initial);
    }
  }, []);

  // Deselect the word-cloud body when clicking outside it.
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (bodyRef.current && !bodyRef.current.contains(e.target)) {
        setBodySelected(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Compute layout once on mount
  const layoutWords = useMemo(() => computeLayout(cloudWords), [cloudWords]);

  // Placeholder layout (same words as default slide, dimmed)
  const placeholderLayout = useMemo(
    () => (cloudWords.length === 0 ? computeLayout(DEFAULT_CLOUD_WORDS) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <SlideCanvas>
      <QuestionEditor
        initialHtml={slide.questionHtml}
        placeholder="What word comes to mind..."
        onInput={(html) => onQuestionChange(slide.id, html)}
      />
      <div
        ref={bodyRef}
        className={`slide-body ${bodySelected ? "selected" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setBodySelected(true);
        }}
      >
        <div className="word-cloud-inner">
          {layoutWords.length === 0 ? (
            placeholderLayout.map((w) => (
              <span
                key={w.id}
                className="word wc-placeholder-word"
                style={{
                  left: `calc(50% + ${w.x}px)`,
                  top: `calc(50% + ${w.y}px)`,
                  fontSize: `${w.size}px`,
                  color: w.color,
                }}
              >
                {w.text}
              </span>
            ))
          ) : (
            layoutWords.map((w) => (
              <span
                key={w.id}
                className="word"
                style={{
                  left: `calc(50% + ${w.x}px)`,
                  top: `calc(50% + ${w.y}px)`,
                  fontSize: `${w.size}px`,
                  color: w.color,
                }}
              >
                {w.text}
              </span>
            ))
          )}
        </div>
      </div>
    </SlideCanvas>
  );
}
