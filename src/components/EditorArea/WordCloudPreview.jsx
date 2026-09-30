import { useEffect, useState, useMemo } from "react";
import "./WordCloudPreview.css";

// Tightly packed visual hierarchy mapping exactly to your reference image.
const POOL = [
  { id: "creative", text: "creative", size: 95, color: "#8D99E4" },
  { id: "fast", text: "fast", size: 85, color: "#5570E0" },
  { id: "leader", text: "leader", size: 80, color: "#2F3C7E" },
  { id: "integration", text: "integration", size: 35, color: "#9B3B36" },
  { id: "inspiration", text: "inspiration", size: 24, color: "#5570E0" },
  { id: "innovation", text: "innovation", size: 22, color: "#F05B51" },
  { id: "performance", text: "performance", size: 22, color: "#2F3C7E" },
  { id: "transformers", text: "transformers", size: 22, color: "#F09A93" },
  { id: "innovative", text: "innovative", size: 22, color: "#8D99E4" },
  { id: "change", text: "change", size: 20, color: "#5570E0" },
  { id: "quality", text: "quality", size: 65, color: "#F09A93" },
  { id: "focus", text: "focus", size: 65, color: "#2F3C7E" },
  { id: "bold", text: "bold", size: 60, color: "#F05B51" },
  { id: "inspire", text: "inspire", size: 55, color: "#8D99E4" },
  { id: "leadership", text: "leadership", size: 50, color: "#5570E0" },
  { id: "quick", text: "quick", size: 50, color: "#F05B51" },
  { id: "leading", text: "leading", size: 45, color: "#2F3C7E" },
  { id: "sharing", text: "sharing", size: 45, color: "#5570E0" },
  { id: "transpiration", text: "transpiration", size: 45, color: "#9B3B36" },
  { id: "top", text: "top", size: 45, color: "#F09A93" },
  { id: "inspirational", text: "inspirational", size: 45, color: "#8D99E4" },
];

// Helper to detect if two bounding boxes overlap
function checkCollision(r1, r2) {
  return !(
    r1.right < r2.left ||
    r1.left > r2.right ||
    r1.bottom < r2.top ||
    r1.top > r2.bottom
  );
}

// 2D Spiral Placement Algorithm: Sorts by size and finds the closest non-overlapping coordinate
function computeLayout(words) {
  if (words.length === 0) return [];

  // Always place the largest words first so they anchor the center
  const sorted = [...words].sort((a, b) => b.size - a.size);
  const placed = [];

  // Use a canvas context to accurately measure text width before rendering
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Smaller spiral constants create a much tighter, denser cluster
  const dTheta = 0.2;
  const a = 1.5;

  for (const w of sorted) {
    ctx.font = `500 ${w.size}px system-ui, sans-serif`;
    const metrics = ctx.measureText(w.text);

    // Add small padding to prevent words from literally touching[cite: 6]
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
      // Multiply by 0.5 to squash the spiral vertically, favoring wider, landscape clusters[cite: 6]
      y = r * Math.sin(theta) * 0.5;

      rect = {
        left: x - width / 2,
        right: x + width / 2,
        top: y - height / 2,
        bottom: y + height / 2,
      };

      // Check against all already placed words
      collision = placed.some((p) => checkCollision(rect, p.rect));
      theta += dTheta;
    }

    placed.push({ ...w, x, y, rect, width, height });
  }

  // Calculate the bounding box of the entire cluster to center it perfectly
  const minX = Math.min(...placed.map((p) => p.rect.left));
  const maxX = Math.max(...placed.map((p) => p.rect.right));
  const minY = Math.min(...placed.map((p) => p.rect.top));
  const maxY = Math.max(...placed.map((p) => p.rect.bottom));

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Subtract the center offset so the entire group anchors around 0,0
  return placed.map((p) => ({
    ...p,
    x: p.x - cx,
    y: p.y - cy,
  }));
}

export default function WordCloudPreview() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    // Add a new word sequentially to trigger the reflow physics
    if (visibleCount < POOL.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [visibleCount]);

  // Only calculate physics for words that are currently on screen
  const visibleWords = POOL.slice(0, visibleCount);
  const layoutWords = useMemo(
    () => computeLayout(visibleWords),
    [visibleWords],
  );

  return (
    <div className="wc-preview">
      {layoutWords.map((w) => (
        <span
          key={w.id}
          className="wc-word"
          style={{
            // Position relative to absolute center
            left: `calc(50% + ${w.x}px)`,
            top: `calc(50% + ${w.y}px)`,
            fontSize: `${w.size}px`,
            color: w.color,
          }}
        >
          <span className="wc-word-pop">{w.text}</span>
        </span>
      ))}
    </div>
  );
}
