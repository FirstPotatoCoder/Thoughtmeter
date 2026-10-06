import { useEffect, useState } from "react";
import "./QaPreview.css";

const PREVIEW_QUESTIONS = [
  {
    id: 1,
    text: "Where are we going on our next trip?",
    likes: 33,
  },
  {
    id: 2,
    text: "Are those numbers from June or July?",
    likes: 8,
  },
  {
    id: 3,
    text: 'How are we defining "key features"?',
    likes: 1,
  },
];

export default function QaPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [direction, setDirection] = useState("next");

  const currentQ = PREVIEW_QUESTIONS[currentIndex];

  useEffect(() => {
    // 1. After 1.3s, mark question as answered (morphs to black "✓ Answered" pill)
    const answerTimer = setTimeout(() => {
      setIsAnswered(true);
    }, 1300);

    // 2. After 2.4s, transition to the next question (scrolls up)
    const nextTimer = setTimeout(() => {
      setDirection("next");
      setIsAnswered(false);
      setCurrentIndex((prev) => (prev + 1) % PREVIEW_QUESTIONS.length);
    }, 2400);

    return () => {
      clearTimeout(answerTimer);
      clearTimeout(nextTimer);
    };
  }, [currentIndex]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setDirection("prev");
      setIsAnswered(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < PREVIEW_QUESTIONS.length - 1) {
      setDirection("next");
      setIsAnswered(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const toggleAnswered = (e) => {
    e.stopPropagation();
    setIsAnswered((prev) => !prev);
  };

  return (
    <div className="qa-preview">
      {/* Up navigation button (hidden on first question) */}
      <button
        className={`qa-preview-nav-btn ${currentIndex === 0 ? "hidden" : ""}`}
        title="Previous question"
        aria-label="Previous question"
        onClick={handlePrev}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* Main question showcase card container */}
      <div className="qa-preview-card-wrapper">
        <div
          key={currentQ.id}
          className={`qa-preview-card ${direction === "next" ? "qa-slide-next" : "qa-slide-prev"}`}
        >
          <div className="qa-preview-answered-count">0/3 answered</div>
          <div className="qa-preview-asked-on">
            Asked on <span className="qa-preview-asked-topic">Ask me anything</span>
          </div>
          <h1 className="qa-preview-question-text">{currentQ.text}</h1>
          <div className="qa-preview-likes">
            <span className="qa-preview-likes-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.88 0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.45-.08-.66a1.002 1.002 0 0 0-.75-.62l-.7-.07-6.06 6.13c-.21.2-.33.48-.33.78V18c0 1.1.9 2 2 2h8c.82 0 1.55-.5 1.86-1.26l2.47-5.86z" />
              </svg>
            </span>
            <span>{currentQ.likes}</span>
          </div>
        </div>
      </div>

      {/* Down navigation button (hidden on last question) */}
      <button
        className={`qa-preview-nav-btn ${currentIndex === PREVIEW_QUESTIONS.length - 1 ? "hidden" : ""}`}
        title="Next question"
        aria-label="Next question"
        onClick={handleNext}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>

      {/* Action pill: transitions between "Press ENTER" hint and "✓ Answered" */}
      <div className="qa-preview-action-wrapper">
        {!isAnswered ? (
          <div className="qa-preview-enter-hint" onClick={toggleAnswered}>
            <span>Press </span>
            <kbd className="qa-preview-kbd">ENTER</kbd>
            <span> to mark as answered</span>
          </div>
        ) : (
          <button className="qa-preview-answered-pill" onClick={toggleAnswered} title="Mark answered">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Answered</span>
          </button>
        )}
      </div>
    </div>
  );
}
