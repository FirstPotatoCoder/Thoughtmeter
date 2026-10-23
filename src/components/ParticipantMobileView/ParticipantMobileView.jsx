import { useState } from 'react';
import './ParticipantMobileView.css';
import Icon from '../Icon/Icon';
import { getActiveDeck } from '../../utils/deckStorage';
import { getSlideSetting, getDefaultMaxResponses } from '../../utils/slideSettings';

// Brand Logo
function MentiLogo({ size = 20 }) {
  return (
    <div className="mobile-brand-logo">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 19V5l7 7 7-7v14h-4V10l-3 3-3-3v9H4z" fill="#1A2044" />
        <path d="M4 5l7 7V5H4z" fill="#F0655A" />
        <path d="M11 12l7-7h-7v7z" fill="#6B5CFF" />
      </svg>
      <span className="mobile-brand-text">Menti</span>
    </div>
  );
}

const DEFAULT_FALLBACK_SLIDE = {
  id: 'fallback_sample',
  type: 'mcq',
  questionHtml: 'Welcome! What would you like to explore today?',
  options: [
    { id: 1, label: 'Interactive Polling & Quizzes' },
    { id: 2, label: 'Word Clouds & Brainstorming' },
    { id: 3, label: 'Live Q&A & Reactions' },
  ],
};

export default function ParticipantMobileView({ roomCode }) {
  const currentDeck = getActiveDeck();
  const slides = currentDeck.slides || [];
  const currentSlide = slides[0] || DEFAULT_FALLBACK_SLIDE;

  // Local participant states
  const [selectedMcqOptions, setSelectedMcqOptions] = useState([]);
  const [wordInputs, setWordInputs] = useState(['', '', '']);
  const [openResponse, setOpenResponse] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaQuestions, setQaQuestions] = useState([
    { id: 1, text: 'Can we access these slides after the presentation?', likes: 3, answered: false },
    { id: 2, text: 'Is there a homework assignment based on this?', likes: 1, answered: false },
  ]);
  const [qaLikes, setQaLikes] = useState({});
  const [qaViewMode, setQaViewMode] = useState('list'); // 'input' | 'list'
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const cleanQuestionTitle = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const triggerReaction = () => {
    setIsLiked(true);
    const id = Date.now() + Math.random();
    const driftX = (Math.random() - 0.5) * 80;
    setFloatingReactions((prev) => [...prev, { id, driftX }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  // MCQ Handlers
  const maxResponses = currentSlide
    ? getSlideSetting(currentSlide.id, 'maxResponses', getDefaultMaxResponses(currentSlide.type), currentSlide.type)
    : 1;
  const isMulti = maxResponses !== 1;

  const handleSelectOption = (idx) => {
    if (isSubmitted) return;
    if (!isMulti) {
      setSelectedMcqOptions([idx]);
    } else {
      setSelectedMcqOptions((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    }
  };

  const handleMcqSubmit = () => {
    if (selectedMcqOptions.length > 0) {
      setIsSubmitted(true);
    }
  };

  // Word Cloud Handlers
  const handleWordChange = (idx, val) => {
    setWordInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleWordSubmit = () => {
    if (wordInputs.some((w) => w.trim())) {
      setIsSubmitted(true);
    }
  };

  // Open-ended Handlers
  const handleOpenSubmit = () => {
    if (openResponse.trim()) {
      setIsSubmitted(true);
    }
  };

  // Q&A Handlers
  const handleQaSubmit = () => {
    if (qaQuestion.trim()) {
      setQaQuestions((prev) => [
        { id: Date.now(), text: qaQuestion.trim(), likes: 0, answered: false },
        ...prev,
      ]);
      setQaQuestion('');
      setQaViewMode('list');
    }
  };

  const handleQaLike = (qId) => {
    setQaLikes((prev) => ({ ...prev, [qId]: !prev[qId] }));
    setQaQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, likes: q.likes + (qaLikes[qId] ? -1 : 1) } : q
      )
    );
  };

  const renderContent = () => {
    if (!currentSlide) {
      return (
        <div className="mobile-waiting-screen">
          <div className="mobile-waiting-icon">
            <Icon name="slides" size={36} />
          </div>
          <h2 className="mobile-waiting-title">You're connected!</h2>
          <p className="mobile-waiting-desc">
            Waiting for the presenter to start the presentation.
          </p>
          <div className="mobile-room-badge">
            Room Code: <strong>{roomCode}</strong>
          </div>
        </div>
      );
    }

    const title = cleanQuestionTitle(currentSlide.questionHtml) || 'Question';

    // 1. MCQ
    if (currentSlide.type === 'mcq') {
      const options = currentSlide.options?.length > 0
        ? currentSlide.options
        : [
            { id: 1, label: 'Option A' },
            { id: 2, label: 'Option B' },
            { id: 3, label: 'Option C' },
          ];

      return (
        <div className="mobile-slide-content">
          <h1 className="mobile-question-heading">{title}</h1>
          {isMulti && (
            <span className="mobile-instruction">Select multiple options</span>
          )}

          <div className="mobile-options-list">
            {options.map((opt, i) => {
              const selected = selectedMcqOptions.includes(i);
              return (
                <button
                  key={opt.id || i}
                  type="button"
                  className={`mobile-option-card ${selected ? 'selected' : ''} ${isSubmitted ? 'submitted-locked' : ''}`}
                  onClick={() => handleSelectOption(i)}
                  disabled={isSubmitted}
                >
                  <span className="mobile-option-indicator">
                    {selected ? (
                      <span className="mobile-check-circle">✓</span>
                    ) : (
                      <span className="mobile-empty-circle" />
                    )}
                  </span>
                  <span className="mobile-option-text">
                    {opt.label || `Option ${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mobile-action-footer">
            {!isSubmitted ? (
              <button
                className="mobile-primary-btn"
                disabled={selectedMcqOptions.length === 0}
                onClick={handleMcqSubmit}
              >
                Submit
              </button>
            ) : (
              <div className="mobile-submitted-banner">
                ✓ Response recorded! Thanks for voting.
              </div>
            )}
          </div>
        </div>
      );
    }

    // 2. Word Cloud
    if (currentSlide.type === 'word-cloud') {
      return (
        <div className="mobile-slide-content">
          <h1 className="mobile-question-heading">{title}</h1>
          <span className="mobile-instruction">Enter your words</span>

          <div className="mobile-inputs-list">
            {wordInputs.map((val, idx) => (
              <input
                key={idx}
                type="text"
                className="mobile-text-input"
                placeholder={`Entry ${idx + 1}`}
                value={val}
                disabled={isSubmitted}
                onChange={(e) => handleWordChange(idx, e.target.value)}
              />
            ))}
          </div>

          <div className="mobile-action-footer">
            {!isSubmitted ? (
              <button
                className="mobile-primary-btn"
                disabled={!wordInputs.some((w) => w.trim())}
                onClick={handleWordSubmit}
              >
                Submit
              </button>
            ) : (
              <div className="mobile-submitted-banner">
                ✓ Words submitted!
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Open-Ended
    if (currentSlide.type === 'open-ended') {
      return (
        <div className="mobile-slide-content">
          <h1 className="mobile-question-heading">{title}</h1>
          <span className="mobile-instruction">Type your response</span>

          <textarea
            className="mobile-textarea"
            rows={4}
            placeholder="Type your response here..."
            value={openResponse}
            disabled={isSubmitted}
            onChange={(e) => setOpenResponse(e.target.value)}
          />

          <div className="mobile-action-footer">
            {!isSubmitted ? (
              <button
                className="mobile-primary-btn"
                disabled={!openResponse.trim()}
                onClick={handleOpenSubmit}
              >
                Submit
              </button>
            ) : (
              <div className="mobile-submitted-banner">
                ✓ Response submitted!
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Q&A
    if (currentSlide.type === 'qa') {
      return (
        <div className="mobile-slide-content mobile-qa-content">
          <h1 className="mobile-question-heading">{title || 'Q&A Session'}</h1>

          {qaViewMode === 'input' ? (
            <div className="mobile-qa-input-box">
              <textarea
                className="mobile-textarea"
                rows={3}
                placeholder="Ask your question..."
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
              />
              <div className="mobile-qa-input-actions">
                <button
                  className="mobile-secondary-btn"
                  onClick={() => setQaViewMode('list')}
                >
                  Cancel
                </button>
                <button
                  className="mobile-primary-btn"
                  disabled={!qaQuestion.trim()}
                  onClick={handleQaSubmit}
                >
                  Submit question
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-qa-list-box">
              <div className="mobile-qa-list">
                {qaQuestions.map((q) => {
                  const liked = !!qaLikes[q.id];
                  return (
                    <div key={q.id} className="mobile-qa-card">
                      <p className="mobile-qa-text">{q.text}</p>
                      <button
                        className={`mobile-qa-like-btn ${liked ? 'liked' : ''}`}
                        onClick={() => handleQaLike(q.id)}
                      >
                        <Icon name="thumbsUp" size={14} />
                        <span>{q.likes}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mobile-qa-footer-bar">
                <button
                  className="mobile-qa-ask-btn"
                  onClick={() => setQaViewMode('input')}
                >
                  Ask a question
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mobile-participant-screen">
      {/* Floating Thumbs-Up Reactions Layer */}
      <div className="mobile-reactions-overlay" aria-hidden="true">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="mobile-floating-bubble"
            style={{ '--drift-x': `${r.driftX}px` }}
          >
            <Icon name="thumbsUp" size={24} />
          </div>
        ))}
      </div>

      {/* Mobile Top Navigation */}
      <header className="mobile-nav-header">
        <MentiLogo size={22} />
        <div className="mobile-header-room-code">
          <span>Code:</span>
          <strong>{roomCode}</strong>
        </div>
      </header>

      {/* Main Responsive Body */}
      <main className="mobile-body-wrapper">{renderContent()}</main>

      {/* Fixed Bottom Reaction Floating Action Button */}
      <div className="mobile-fab-container">
        <button
          className={`mobile-reaction-fab ${isLiked ? 'liked' : ''}`}
          onClick={triggerReaction}
          title="Send thumbs-up reaction"
        >
          <Icon name="thumbsUp" size={22} />
        </button>
      </div>
    </div>
  );
}
