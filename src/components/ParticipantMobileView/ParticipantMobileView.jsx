import { useState, useEffect, useRef } from 'react';
import './ParticipantMobileView.css';
import Icon from '../Icon/Icon';
import { getSlideSetting, getDefaultMaxResponses } from '../../utils/slideSettings';
import { joinParticipantSession } from '../../services/roomService';

// Brand Logo matching Preview Screen
function MentiLogo({ size = 20, className = '' }) {
  return (
    <div className={`menti-brand-logo ${className}`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 19V5l7 7 7-7v14h-4V10l-3 3-3-3v9H4z" fill="#1A2044" />
        <path d="M4 5l7 7V5H4z" fill="#F0655A" />
        <path d="M11 12l7-7h-7v7z" fill="#6B5CFF" />
      </svg>
      <span className="menti-brand-text">Menti</span>
    </div>
  );
}

export default function ParticipantMobileView({ roomCode }) {
  const [currentSlide, setCurrentSlide] = useState(null);
  const sessionRef = useRef(null);

  const cleanCode = (roomCode || '').replace(/\s+/g, '');
  const storageKey = `thoughtmeter_participant_submissions_${cleanCode}`;

  // Submissions tracked per slide ID:
  // {
  //   [slideId]: {
  //     isSubmitted: boolean, // for MCQ
  //     selectedOptions: number[], // for MCQ
  //     words: string[], // for word-cloud
  //     responses: string[], // for open-ended
  //     isLiked: boolean, // for reaction thumbs up
  //     qaQuestions: Array<{ id, text, likes, answered }>,
  //     userLikedQuestions: Record<string, boolean>
  //   }
  // }
  const [submissionsBySlide, setSubmissionsBySlide] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Sync submissions to sessionStorage for persistence across mobile refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(submissionsBySlide));
    } catch {
      // Ignore quota errors
    }
  }, [submissionsBySlide, storageKey]);

  // Temporary / draft input states for the currently displayed slide
  const [selectedMcqOptions, setSelectedMcqOptions] = useState([]);
  const [wordInput, setWordInput] = useState('');
  const [openInput, setOpenInput] = useState('');
  const [qaInput, setQaInput] = useState('');
  const [qaViewMode, setQaViewMode] = useState('input'); // 'input' | 'list'
  const [qaFilter, setQaFilter] = useState('Recent');
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Subscribe to live room via Realtime Service
  useEffect(() => {
    const session = joinParticipantSession(roomCode);
    sessionRef.current = session;

    const unsubSlide = session.onSlideChange(({ slide }) => {
      if (slide) {
        setCurrentSlide((prevSlide) => {
          if (!prevSlide || prevSlide.id !== slide.id) {
            // Reset only unsubmitted draft input states when moving between slides.
            // All submitted answers remain permanently locked per slide ID.
            setSelectedMcqOptions([]);
            setWordInput('');
            setOpenInput('');
            setQaInput('');
            setQaViewMode('input');
          }
          return slide;
        });
      }
    });

    return () => {
      unsubSlide();
      session.close();
    };
  }, [roomCode]);

  const slideTitle = currentSlide?.questionHtml
    ? currentSlide.questionHtml.replace(/<[^>]*>/g, '').trim()
    : '';

  const slideMaxResponses =
    currentSlide?.maxResponses !== undefined
      ? currentSlide.maxResponses
      : currentSlide
      ? getSlideSetting(
          currentSlide.id,
          'maxResponses',
          getDefaultMaxResponses(currentSlide.type),
          currentSlide.type,
        )
      : 1;

  // Active submission data for the current slide
  const currentSub = (currentSlide?.id && submissionsBySlide[currentSlide.id]) || {};
  const isSubmitted = !!currentSub.isSubmitted;
  const submittedWords = currentSub.words || [];
  const submittedResponses = currentSub.responses || [];
  const isLiked = !!currentSub.isLiked;
  const userLikedQuestions = currentSub.userLikedQuestions || {};
  const qaQuestions = currentSub.qaQuestions || [
    { id: 1, text: 'Can we access these slides after the presentation?', likes: 3, answered: false },
    { id: 2, text: 'Is there a homework assignment based on this?', likes: 1, answered: false },
  ];

  // Reaction interaction matching preview screen
  const handleToggleLike = () => {
    if (!currentSlide) return;
    setSubmissionsBySlide((prev) => ({
      ...prev,
      [currentSlide.id]: {
        ...prev[currentSlide.id],
        isLiked: true,
      },
    }));
    sessionRef.current?.sendReaction('thumbsUp');
    const id = Date.now() + Math.random();
    const driftX = (Math.random() - 0.5) * 80;
    setFloatingReactions((prev) => [...prev, { id, driftX }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  // 1. MCQ Handler
  const isMulti = slideMaxResponses !== 1;
  const handleSelectOption = (i) => {
    if (isSubmitted) return;
    if (!isMulti) {
      setSelectedMcqOptions([i]);
    } else {
      setSelectedMcqOptions((prev) => {
        if (prev.includes(i)) {
          return prev.filter((idx) => idx !== i);
        }
        const max = slideMaxResponses === 'unlimited' ? Infinity : slideMaxResponses;
        if (prev.length < max) {
          return [...prev, i];
        }
        return prev;
      });
    }
  };

  const handleMcqSubmit = () => {
    if (selectedMcqOptions.length > 0 && currentSlide && !isSubmitted) {
      sessionRef.current?.submitVote(currentSlide.id, {
        type: 'mcq',
        selectedOptionIndices: selectedMcqOptions,
      });
      setSubmissionsBySlide((prev) => ({
        ...prev,
        [currentSlide.id]: {
          ...prev[currentSlide.id],
          isSubmitted: true,
          selectedOptions: [...selectedMcqOptions],
        },
      }));
      setSelectedMcqOptions([]);
    }
  };

  // 2. Word Cloud Handler
  const handleWordSubmit = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed || !currentSlide) return;
    const isLimitReached =
      slideMaxResponses !== 'unlimited' && submittedWords.length >= slideMaxResponses;
    if (isLimitReached) return;

    sessionRef.current?.submitVote(currentSlide.id, {
      type: 'word-cloud',
      words: [trimmed],
    });
    setSubmissionsBySlide((prev) => {
      const existing = prev[currentSlide.id]?.words || [];
      return {
        ...prev,
        [currentSlide.id]: {
          ...prev[currentSlide.id],
          words: [...existing, trimmed],
        },
      };
    });
    setWordInput('');
  };

  // 3. Open-Ended Handler
  const handleOpenSubmit = () => {
    const trimmed = openInput.trim();
    if (!trimmed || !currentSlide) return;
    const isLimitReached =
      slideMaxResponses !== 'unlimited' && submittedResponses.length >= slideMaxResponses;
    if (isLimitReached) return;

    sessionRef.current?.submitVote(currentSlide.id, {
      type: 'open-ended',
      text: trimmed,
    });
    setSubmissionsBySlide((prev) => {
      const existing = prev[currentSlide.id]?.responses || [];
      return {
        ...prev,
        [currentSlide.id]: {
          ...prev[currentSlide.id],
          responses: [...existing, trimmed],
        },
      };
    });
    setOpenInput('');
  };

  // 4. Q&A Handlers
  const handleQaSubmit = () => {
    const trimmed = qaInput.trim();
    if (!trimmed || !currentSlide) return;

    sessionRef.current?.submitVote(currentSlide.id, {
      type: 'qa',
      text: trimmed,
    });
    const newQ = { id: Date.now(), text: trimmed, likes: 0, answered: false };
    setSubmissionsBySlide((prev) => {
      const existingSub = prev[currentSlide.id] || {};
      const existingQuestions = existingSub.qaQuestions || [
        { id: 1, text: 'Can we access these slides after the presentation?', likes: 3, answered: false },
        { id: 2, text: 'Is there a homework assignment based on this?', likes: 1, answered: false },
      ];
      return {
        ...prev,
        [currentSlide.id]: {
          ...existingSub,
          qaQuestions: [newQ, ...existingQuestions],
        },
      };
    });
    setQaInput('');
    setQaViewMode('list');
  };

  const handleQaLike = (qId) => {
    if (!currentSlide) return;
    const isCurrentlyLiked = !!userLikedQuestions[qId];
    setSubmissionsBySlide((prev) => {
      const existingSub = prev[currentSlide.id] || {};
      const existingLiked = existingSub.userLikedQuestions || {};
      const existingQuestions = existingSub.qaQuestions || [
        { id: 1, text: 'Can we access these slides after the presentation?', likes: 3, answered: false },
        { id: 2, text: 'Is there a homework assignment based on this?', likes: 1, answered: false },
      ];
      const updatedQuestions = existingQuestions.map((q) => {
        if (q.id !== qId) return q;
        const newLikes = isCurrentlyLiked ? Math.max(0, q.likes - 1) : q.likes + 1;
        return { ...q, likes: newLikes };
      });

      return {
        ...prev,
        [currentSlide.id]: {
          ...existingSub,
          userLikedQuestions: {
            ...existingLiked,
            [qId]: !isCurrentlyLiked,
          },
          qaQuestions: updatedQuestions,
        },
      };
    });
  };

  const renderContent = () => {
    if (!currentSlide) {
      return (
        <div className="phone-body mcq-phone-sent">
          <div className="phone-hourglass-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <path d="M6 2v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2H6z" fill="#7B88E8" />
              <path d="M6 22v-6a6 6 0 0 1 6-6 6 6 0 0 1 6 6v6H6z" fill="#9BA7F0" />
            </svg>
          </div>
          <h3 className="phone-wait-title">You&apos;re connected!</h3>
          <p className="phone-help-text" style={{ marginTop: '8px' }}>
            Waiting for the presenter to start the presentation.
          </p>
        </div>
      );
    }

    // A. MCQ Slide
    if (currentSlide.type === 'mcq') {
      const options =
        currentSlide.options && currentSlide.options.length > 0
          ? currentSlide.options
          : [
              { id: 1, label: '' },
              { id: 2, label: '' },
              { id: 3, label: '' },
            ];

      if (!isSubmitted) {
        return (
          <div className="phone-body mcq-phone-body">
            {slideTitle && <h3 className="phone-slide-title">{slideTitle}</h3>}
            {isMulti && (
              <p className="phone-help-text">
                {slideMaxResponses === 'unlimited'
                  ? 'Select as many options as you like'
                  : `Select up to ${slideMaxResponses} options (${slideMaxResponses - selectedMcqOptions.length} remaining)`}
              </p>
            )}
            <div className="phone-mcq-options">
              {options.map((opt, i) => {
                const isSelected = selectedMcqOptions.includes(i);
                return (
                  <button
                    key={opt.id || i}
                    type="button"
                    className={`phone-mcq-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(i)}
                  >
                    <span className="phone-mcq-label">{opt.label || 'Option'}</span>
                    <span className={`phone-mcq-indicator ${isMulti ? 'checkbox' : 'radio'}`} />
                  </button>
                );
              })}
            </div>
            <button
              className="phone-submit-btn"
              disabled={selectedMcqOptions.length === 0}
              onClick={handleMcqSubmit}
            >
              Submit
            </button>
          </div>
        );
      }

      // Sent state matching preview screen
      return (
        <div className="phone-body mcq-phone-sent">
          <div className="phone-hourglass-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <path d="M6 2v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2H6z" fill="#7B88E8" />
              <path d="M6 22v-6a6 6 0 0 1 6-6 6 6 0 0 1 6 6v6H6z" fill="#9BA7F0" />
            </svg>
          </div>
          <h3 className="phone-wait-title">Please wait for the presenter to change slides.</h3>
        </div>
      );
    }

    // B. Word Cloud Slide
    if (currentSlide.type === 'word-cloud') {
      const isLimitReached =
        slideMaxResponses !== 'unlimited' && submittedWords.length >= slideMaxResponses;

      const helperMessage = () => {
        if (isLimitReached) {
          return `You have reached the response limit (${submittedWords.length}/${slideMaxResponses})`;
        }
        if (slideMaxResponses === 'unlimited') {
          return 'You may submit multiple responses';
        }
        if (submittedWords.length > 0) {
          return `You may submit up to ${slideMaxResponses} responses (${slideMaxResponses - submittedWords.length} left)`;
        }
        return `You may submit up to ${slideMaxResponses} responses`;
      };

      return (
        <div className="phone-body">
          {slideTitle && <h3 className="phone-slide-title">{slideTitle}</h3>}
          <div className="phone-input-group">
            <input
              type="text"
              maxLength={25}
              className="phone-input"
              placeholder={isLimitReached ? 'Response limit reached' : 'Enter a word'}
              value={wordInput}
              disabled={isLimitReached}
              onChange={(e) => setWordInput(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === 'Enter' && !isLimitReached && handleWordSubmit()}
            />
            <span className="phone-char-limit">{25 - wordInput.length}</span>
          </div>

          <p className="phone-help-text">{helperMessage()}</p>
          {submittedWords.length > 0 && (
            <p className="phone-success-text">Thanks, we received your input!</p>
          )}

          <button
            className="phone-submit-btn"
            disabled={isLimitReached || !wordInput.trim()}
            onClick={handleWordSubmit}
          >
            Submit
          </button>
        </div>
      );
    }

    // C. Open-Ended Slide
    if (currentSlide.type === 'open-ended') {
      const isLimitReached =
        slideMaxResponses !== 'unlimited' && submittedResponses.length >= slideMaxResponses;

      const helperMessage = () => {
        if (isLimitReached) {
          return `You have reached the response limit (${submittedResponses.length}/${slideMaxResponses})`;
        }
        if (slideMaxResponses === 'unlimited') {
          return 'You may submit multiple responses';
        }
        if (submittedResponses.length > 0) {
          return `You may submit up to ${slideMaxResponses} responses (${slideMaxResponses - submittedResponses.length} left)`;
        }
        return `You may submit up to ${slideMaxResponses} responses`;
      };

      return (
        <div className="phone-body">
          {slideTitle && <h3 className="phone-slide-title">{slideTitle}</h3>}
          <div className="phone-textarea-group">
            <textarea
              className="phone-textarea"
              maxLength={200}
              placeholder={
                isLimitReached
                  ? 'Response limit reached'
                  : 'Short responses are recommended.\nYou have 200 characters left.'
              }
              value={openInput}
              disabled={isLimitReached}
              onChange={(e) => setOpenInput(e.target.value)}
            />
          </div>

          <p className="phone-help-text">{helperMessage()}</p>
          {submittedResponses.length > 0 && (
            <p className="phone-success-text">Thanks, we received your input!</p>
          )}

          <button
            className="phone-submit-btn"
            disabled={isLimitReached || !openInput.trim()}
            onClick={handleOpenSubmit}
          >
            Submit
          </button>
        </div>
      );
    }

    // D. Q&A Slide
    if (currentSlide.type === 'qa') {
      const sortedQuestions = [...qaQuestions].sort((a, b) => {
        if (qaFilter === 'Top') {
          return (b.likes || 0) - (a.likes || 0);
        }
        return (b.id || 0) - (a.id || 0);
      });

      if (qaQuestions.length === 0 || qaViewMode === 'input') {
        return (
          <div className="phone-qa-sheet">
            <div className="phone-qa-sheet-top">
              <span className="phone-qa-sheet-title">Q&A</span>
              {qaQuestions.length > 0 && (
                <button
                  className="phone-qa-sheet-close"
                  onClick={() => setQaViewMode('list')}
                  title="Close"
                >
                  ×
                </button>
              )}
            </div>

            <div className="phone-qa-input-view">
              <h3 className="phone-qa-new-title">New question</h3>
              <div className="phone-qa-textarea-group">
                <textarea
                  className="phone-qa-textarea"
                  placeholder="Short responses are recommended. You have 200 characters left."
                  maxLength={200}
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                />
              </div>
              <button
                className="phone-qa-submit-button"
                disabled={!qaInput.trim()}
                onClick={handleQaSubmit}
              >
                Submit
              </button>
              <div className="phone-bottom-actions phone-qa-bottom-actions">
                <button
                  className={`phone-thumbs-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                  title="Send reaction"
                >
                  <Icon name="thumbsUp" size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="phone-qa-sheet">
          <div className="phone-qa-sheet-top">
            <span className="phone-qa-sheet-title">Q&A</span>
            <button
              className="phone-qa-sheet-close"
              onClick={() => {
                setQaInput('');
                setQaViewMode('input');
              }}
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="phone-qa-select-container">
            <select
              className="phone-qa-select-field"
              value={qaFilter}
              onChange={(e) => setQaFilter(e.target.value)}
            >
              <option value="Recent">Recent</option>
              <option value="Top">Top</option>
            </select>
            <div className="phone-qa-select-arrows">
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                <path d="M5 2L8 5H2L5 2Z" fill="#333333" />
                <path d="M5 12L2 9H8L5 12Z" fill="#333333" />
              </svg>
            </div>
          </div>

          <div className="phone-qa-list">
            {sortedQuestions.map((q) => {
              const isQuestionLiked = !!userLikedQuestions[q.id];
              return (
                <div key={q.id} className="phone-qa-item">
                  <div className="phone-qa-item-content">
                    <span className="phone-qa-badge">your question</span>
                    <p className="phone-qa-item-text">{q.text}</p>
                  </div>
                  <div className="phone-qa-like-column">
                    <button
                      className={`phone-qa-like-pill ${isQuestionLiked ? 'liked' : ''}`}
                      onClick={() => handleQaLike(q.id)}
                      title={isQuestionLiked ? 'Unlike' : 'Like'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.88 0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.45-.08-.66a1.002 1.002 0 0 0-.75-.62l-.7-.07-6.06 6.13c-.21.2-.33.48-.33.78V18c0 1.1.9 2 2 2h8c.82 0 1.55-.5 1.86-1.26l2.47-5.86z" />
                      </svg>
                    </button>
                    <span className="phone-qa-like-number">{q.likes || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="phone-qa-bottom">
            <button
              className="phone-qa-ask-button"
              onClick={() => {
                setQaInput('');
                setQaViewMode('input');
              }}
            >
              Ask new question
            </button>
            <button
              className={`phone-thumbs-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleToggleLike}
              title="Send reaction"
            >
              <Icon name="thumbsUp" size={20} />
            </button>
          </div>
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

      <div
        className={`participant-phone-frame ${currentSlide?.type === 'qa' ? 'qa-phone-mode' : ''}`}
      >
        {currentSlide?.type === 'qa' ? (
          <div className="phone-qa-backdrop">
            <MentiLogo size={24} />
          </div>
        ) : (
          <div className="phone-header">
            <MentiLogo size={20} />
          </div>
        )}

        {/* Dynamic content identical to Preview Modal's Participant Screen */}
        {renderContent()}

        {/* Thumbs up reaction */}
        {currentSlide?.type !== 'qa' && (
          <div className="phone-bottom-actions">
            <button
              className={`phone-thumbs-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleToggleLike}
              title="Send reaction"
            >
              <Icon name="thumbsUp" size={20} />
            </button>
          </div>
        )}

        {/* Mentimeter Phone Footer */}
        {currentSlide?.type !== 'qa' && (
          <div className="phone-footer">
            <a
              href="#mentimeter"
              className="phone-footer-link"
              onClick={(e) => e.preventDefault()}
            >
              Powered by Mentimeter
            </a>
            <p className="phone-footer-terms">
              By using Mentimeter you accept our <u>terms of use</u> and <u>policies</u>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
