import { useEffect, useState } from "react";
import "./OpenEndedPreview.css";

const RESPONSES = [
  "Creative thinking is essential for progress.",
  "No one can make you feel inferior without your consent.",
  "The only impossible journey is the one you never begin.",
  "Do or do not. There is no try.",
  "Be the change that you wish to see in the world.",
  "What defines us isn't how many times we crash but the number of times we get back up.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "In the middle of difficulty lies opportunity.",
  "It does not matter how slowly you go as long as you do not stop.",
  "The only way to do great work is to love what you do.",
  "Stay hungry, stay foolish.",
  "Life is what happens when you're busy making other plans.",
  "The purpose of our lives is to be happy.",
  "Get busy living or get dying.",
  "You only live once, but if you do it right, once is enough.",
];

export default function OpenEndedPreview() {
  // Partition into two columns to allow independent heights
  // while maintaining the left-right-left-right sequential order
  const leftColumn = RESPONSES.filter((_, i) => i % 2 === 0);
  const rightColumn = RESPONSES.filter((_, i) => i % 2 !== 0);

  // Reduced the animation delay slightly (from 0.7s to 0.2s)
  // so the user isn't waiting 10+ seconds for all cards to appear,
  // but the alternating sequence logic remains exactly as requested.
  return (
    <div className="open-ended-preview">
      <div className="oe-column">
        {leftColumn.map((text, index) => {
          const originalIndex = index * 2;
          return (
            <div
              key={originalIndex}
              className="oe-response"
              style={{ animationDelay: `${originalIndex * 0.8}s` }}
            >
              {text}
            </div>
          );
        })}
      </div>

      <div className="oe-column">
        {rightColumn.map((text, index) => {
          const originalIndex = index * 2 + 1;
          return (
            <div
              key={originalIndex}
              className="oe-response"
              style={{ animationDelay: `${originalIndex * 0.8}s` }}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
