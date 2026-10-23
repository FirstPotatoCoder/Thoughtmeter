import React, { useState, useEffect, useMemo, useRef } from 'react';
import './PresentationPreview.css';
import Icon from '../Icon/Icon';
import SlideScaler from '../EditorArea/SlideScaler';
import WordCloudPreview from '../EditorArea/WordCloudPreview';
import McqPreview from '../EditorArea/McqPreview';
import OpenEndedPreview from '../EditorArea/OpenEndedPreview';
import QaPreview from '../EditorArea/QaPreview';
import { MCQ_COLORS } from '../../palette';
import {
  subscribeSlideSettings,
  getSlideSetting,
  getDefaultMaxResponses,
  getSlideDeck,
  setActiveSlide,
  getViewMode,
} from '../../utils/slideSettings';

const CLOUD_PALETTE = ['#5570E0', '#F05B51', '#8D99E4', '#2F3C7E', '#F09A93', '#9B3B36'];

// Brand Menti Logo matching reference screenshots
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

// Default demonstration deck covering all slide types in order (MCQ, Cloud, Open-ended, Q&A)
const DEFAULT_PREVIEW_DECK = [
  {
    id: 'demo-mcq',
    type: 'mcq',
    questionHtml: 'Which one these is right',
    options: [
      { id: 1, label: '', color: '#5E6BE8' },
      { id: 2, label: '', color: '#EE6D62' },
      { id: 3, label: '', color: '#2C3E8A' },
    ],
  },
  {
    id: 'demo-cloud',
    type: 'word-cloud',
    questionHtml: '',
    cloudWords: [],
  },
  {
    id: 'demo-open',
    type: 'open-ended',
    questionHtml: '',
  },
  {
    id: 'demo-qa',
    type: 'qa',
    questionHtml: '',
  },
];

export default function PresentationPreview({
  slide = null,
  slides = [],
  activeSlideId = null,
  onSelectSlide,
  onClose,
}) {
  // Re-render when slide settings change in RightSidebar Edit drawer or slide deck updates
  const [settingsTick, setSettingsTick] = useState(0);
  const [viewMode, setViewModeState] = useState(getViewMode);
  const isPresentationMode = viewMode === 'presentation';

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [isResultsHidden, setIsResultsHidden] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const controlsTimeoutRef = useRef(null);

  const handleUserActivity = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 2800);
  };

  useEffect(() => {
    if (!isPresentationMode) return;
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPresentationMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose?.();
  };

  useEffect(() => {
    return subscribeSlideSettings(() => {
      setSettingsTick((t) => t + 1);
      setViewModeState(getViewMode());
    });
  }, []);

  // Build preview deck: responds directly to the user's slide deck!
  const deck = useMemo(() => {
    const candidateSlides = (slides && slides.length > 0) ? slides : getSlideDeck();
    if (candidateSlides && candidateSlides.length > 0) {
      if (slide) {
        return candidateSlides.map((s) => (s.id === slide.id ? { ...s, ...slide } : s));
      }
      return candidateSlides;
    }
    if (slide) return [slide];
    return DEFAULT_PREVIEW_DECK;
  }, [slides, slide, settingsTick]);

  // Initial slide index matching the active slide
  const initialIndex = useMemo(() => {
    const targetId = activeSlideId || slide?.id;
    if (targetId && deck.length > 0) {
      const idx = deck.findIndex((s) => s.id === targetId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [deck, activeSlideId, slide]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialIndex);
  const [testResponses, setTestResponses] = useState(false);

  // Pop-up & Widget Toggles: QR ON by default, Timer OFF by default
  const [isQrOpen, setIsQrOpen] = useState(true);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Timer countdown state
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Floating live thumbs-up reactions
  const [reactions, setReactions] = useState([]);

  const triggerThumbsUp = () => {
    const id = Date.now() + Math.random();
    const startRight = 40 + Math.random() * 100;
    const driftX = (Math.random() - 0.5) * 140;
    const size = 26 + Math.floor(Math.random() * 10);
    const duration = 1.8 + Math.random() * 0.5;
    const rotation = -15 + Math.random() * 30;

    setReactions((prev) => [
      ...prev,
      { id, startRight, driftX, size, duration, rotation },
    ]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  const renderReactionsOverlay = () => (
    <div className="presenter-reactions-overlay" aria-hidden="true">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="floating-reaction"
          style={{
            right: `${r.startRight}px`,
            '--drift-x': `${r.driftX}px`,
            '--duration': `${r.duration}s`,
            '--rotation': `${r.rotation}deg`,
          }}
        >
          <div className="reaction-bubble">
            <Icon name="thumbsUp" size={r.size} />
          </div>
        </div>
      ))}
    </div>
  );

  // Reusable Timer Widget matching Menti design
  const renderTimerWidget = (extraClass = '') => (
    <div className={`host-timer-widget ${extraClass}`}>
      <button
        className="timer-close-btn"
        onClick={() => {
          setIsTimerOpen(false);
          setIsTimerRunning(false);
        }}
        title="Close timer"
      >
        ×
      </button>

      <div className="timer-controls-row">
        <button
          className="timer-control-btn timer-minus-btn"
          onClick={() => setTimerSeconds((prev) => Math.max(10, prev - 30))}
          title="Subtract 30s"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="7" width="12" height="2" rx="1" />
          </svg>
        </button>

        <span className="timer-display-text">{formatTime(timerSeconds)}</span>

        <div className="timer-right-actions">
          <button
            className="timer-control-btn timer-plus-btn"
            onClick={() => setTimerSeconds((prev) => prev + 30)}
            title="Add 30s"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="7" width="12" height="2" rx="1" />
              <rect x="7" y="2" width="2" height="12" rx="1" />
            </svg>
          </button>
          <button
            className="timer-play-btn"
            onClick={() => setIsTimerRunning((prev) => !prev)}
            title={isTimerRunning ? 'Pause timer' : 'Start timer'}
          >
            {isTimerRunning ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
                <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: '1.5px' }}>
                <path d="M4 2.5v11l9-5.5-9-5.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Submissions per slide:
  // mcq: { selectedOptionIndices: [0, 2] }
  // word-cloud: { words: ['apple', 'pie'] }
  // open-ended: { responses: ['response 1', 'response 2'] }
  // qa: { questions: [{ id, text, likes, answered }] }
  const [userSubmissions, setUserSubmissions] = useState({});
  const [participantLikes, setParticipantLikes] = useState({});

  // Participant form inputs
  const [selectedMcqOptions, setSelectedMcqOptions] = useState([]);
  const [wordInput, setWordInput] = useState('');
  const [openInput, setOpenInput] = useState('');
  const [qaInput, setQaInput] = useState('');
  const [qaViewMode, setQaViewMode] = useState('input'); // 'input' | 'list'
  const [qaFilter, setQaFilter] = useState('Recent');
  const [userLikedQuestions, setUserLikedQuestions] = useState({});

  // Join code generated once per preview session
  const [joinCode] = useState(() => {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    return `${p1} ${p2}`;
  });

  // Generate dynamic join URL pointing to our mobile join route
  const cleanJoinCode = joinCode.replace(/\s+/g, '');
  const basePath = typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '')
    : '';
  const dynamicJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${basePath}/#/join/${cleanJoinCode}`
    : `https://menti.com/${cleanJoinCode}`;

  const currentSlide = deck[currentSlideIndex] || deck[0];
  const slideTitle = currentSlide?.questionHtml ? currentSlide.questionHtml.replace(/<[^>]*>/g, '').trim() : '';

  // Inherit max responses setting from Edit drawer (checks slideId and slideType)
  const slideMaxResponses = getSlideSetting(
    currentSlide?.id,
    'maxResponses',
    getDefaultMaxResponses(currentSlide?.type),
    currentSlide?.type
  );

  const currentSubmission = userSubmissions[currentSlide.id];
  const submissionCount = currentSlide.type === 'word-cloud'
    ? (currentSubmission?.words?.length || 0)
    : currentSlide.type === 'open-ended'
    ? (currentSubmission?.responses?.length || 0)
    : currentSlide.type === 'qa'
    ? (currentSubmission?.questions?.length || 0)
    : (currentSubmission?.selectedOptionIndices?.length ? 1 : 0);

  // Whether current slide has received a response (either via toggle or participant submit)
  const hasResponse = testResponses || submissionCount > 0;

  // Timer interval countdown
  useEffect(() => {
    if (!isTimerRunning || !isTimerOpen) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isTimerOpen]);

  // Format MM:SS for timer
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Slide navigation
  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      const newIdx = currentSlideIndex - 1;
      setCurrentSlideIndex(newIdx);
      if (deck[newIdx]) {
        setActiveSlide(deck[newIdx]);
      }
      if (onSelectSlide && deck[newIdx]?.id) {
        onSelectSlide(deck[newIdx].id);
      }
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < deck.length - 1) {
      const newIdx = currentSlideIndex + 1;
      setCurrentSlideIndex(newIdx);
      if (deck[newIdx]) {
        setActiveSlide(deck[newIdx]);
      }
      if (onSelectSlide && deck[newIdx]?.id) {
        onSelectSlide(deck[newIdx].id);
      }
    } else {
      onClose?.();
    }
  };

  // Keyboard navigation for slides (Left / Right / Space / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'i' || e.key === 'I') {
        setIsQrOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setIsTimerOpen((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        setIsResultsHidden((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        triggerThumbsUp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, deck.length]);

  // Participant submissions (Accumulative)
  const handleMcqSubmit = () => {
    if (selectedMcqOptions.length > 0) {
      setUserSubmissions((prev) => ({
        ...prev,
        [currentSlide.id]: {
          selectedOptionIndices: [...selectedMcqOptions],
        },
      }));
    }
  };

  const handleWordSubmit = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed) return;
    const existing = userSubmissions[currentSlide.id]?.words || [];
    if (slideMaxResponses !== 'unlimited' && existing.length >= slideMaxResponses) return;

    setUserSubmissions((prev) => ({
      ...prev,
      [currentSlide.id]: {
        words: [...existing, trimmed],
      },
    }));
    setWordInput('');
  };

  const handleOpenSubmit = () => {
    const trimmed = openInput.trim();
    if (!trimmed) return;
    const existing = userSubmissions[currentSlide.id]?.responses || [];
    if (slideMaxResponses !== 'unlimited' && existing.length >= slideMaxResponses) return;

    setUserSubmissions((prev) => ({
      ...prev,
      [currentSlide.id]: {
        responses: [...existing, trimmed],
      },
    }));
    setOpenInput('');
  };

  const handleQaSubmit = () => {
    const trimmed = qaInput.trim();
    if (!trimmed) return;
    const existing = userSubmissions[currentSlide.id]?.questions || [];
    const newQ = { id: Date.now(), text: trimmed, likes: 0, answered: false };

    setUserSubmissions((prev) => ({
      ...prev,
      [currentSlide.id]: {
        questions: [...existing, newQ],
      },
    }));
    setQaInput('');
    setQaViewMode('list');
  };

  const handleToggleLike = () => {
    setParticipantLikes((prev) => ({
      ...prev,
      [currentSlide.id]: true,
    }));
    triggerThumbsUp();
  };

  const handleQaLike = (questionId) => {
    const isCurrentlyLiked = !!userLikedQuestions[questionId];
    setUserLikedQuestions((prev) => ({
      ...prev,
      [questionId]: !isCurrentlyLiked,
    }));
    setUserSubmissions((prev) => {
      const current = prev[currentSlide.id];
      if (!current || !current.questions) return prev;
      const updated = current.questions.map((q) => {
        if (q.id !== questionId) return q;
        const newLikes = isCurrentlyLiked ? Math.max(0, (q.likes || 1) - 1) : (q.likes || 0) + 1;
        return { ...q, likes: newLikes };
      });
      return {
        ...prev,
        [currentSlide.id]: { ...current, questions: updated },
      };
    });
  };

  const handleToggleQuestionAnswered = (questionId) => {
    setUserSubmissions((prev) => {
      const current = prev[currentSlide.id];
      if (!current || !current.questions) return prev;
      const updated = current.questions.map((q) =>
        q.id === questionId ? { ...q, answered: !q.answered } : q
      );
      return {
        ...prev,
        [currentSlide.id]: { ...current, questions: updated },
      };
    });
  };

  // Render Presenter Canvas Body Content
  const renderPresenterContent = (showTestResponses = testResponses) => {
    if (isResultsHidden) {
      return (
        <div className="results-hidden-placeholder">
          <Icon name="eyeSlash" size={40} className="results-hidden-icon" />
          <p className="results-hidden-title">Results are hidden</p>
          <p className="results-hidden-subtitle">Show results with key [H] or toolbar button</p>
        </div>
      );
    }

    const isMcq = currentSlide.type === 'mcq';
    const isCloud = currentSlide.type === 'word-cloud';
    const isOpen = currentSlide.type === 'open-ended';
    const isQa = currentSlide.type === 'qa';

    if (isMcq) {
      const options = currentSlide.options && currentSlide.options.length > 0
        ? currentSlide.options
        : [
            { id: 1, label: '', color: '#5E6BE8' },
            { id: 2, label: '', color: '#EE6D62' },
            { id: 3, label: '', color: '#2C3E8A' },
          ];

      // Re-use hovered preview component when test responses switch is ON
      if (showTestResponses && !isResultsHidden) {
        return <McqPreview options={options} />;
      }

      const submission = userSubmissions[currentSlide.id];
      const selectedIndices = submission?.selectedOptionIndices || [];

      if (selectedIndices.length > 0) {
        return (
          <div className="mcq-sent-preview">
            {options.map((opt, i) => {
              const isSelected = selectedIndices.includes(i);
              return (
                <div key={opt.id || i} className="mcq-sent-col">
                  {isSelected ? (
                    <div className="mcq-sent-bar-wrapper">
                      <span className="mcq-sent-count">1</span>
                      <div
                        className="mcq-sent-bar"
                        style={{ background: opt.color || '#5E6BE8' }}
                      />
                    </div>
                  ) : (
                    <div className="mcq-sent-empty-wrapper">
                      <span className="mcq-unsent-count">0</span>
                      <div
                        className="mcq-unsent-line"
                        style={{ background: opt.color || MCQ_COLORS[i % MCQ_COLORS.length] }}
                      />
                    </div>
                  )}
                  <span className="mcq-sent-label">{opt.label || 'Option'}</span>
                </div>
              );
            })}
          </div>
        );
      }

      // Unsent baseline (preview_mcq.png)
      return (
        <div className="mcq-unsent-preview">
          {options.map((opt, i) => (
            <div key={opt.id || i} className="mcq-unsent-col">
              <span className="mcq-unsent-count">0</span>
              <div
                className="mcq-unsent-line"
                style={{ background: opt.color || MCQ_COLORS[i % MCQ_COLORS.length] }}
              />
              <span className="mcq-unsent-label">{opt.label || 'Option'}</span>
            </div>
          ))}
        </div>
      );
    }

    if (isCloud) {
      // Re-use hovered preview component when test responses switch is ON
      if (showTestResponses && !isResultsHidden) {
        return <WordCloudPreview />;
      }

      const rawWords = userSubmissions[currentSlide.id]?.words || [];
      const words = rawWords
        .map((w) => (typeof w === 'string' ? w.trim().toLowerCase() : ''))
        .filter(Boolean);

      if (words.length === 0) {
        return <div className="presenter-empty-canvas" />;
      }

      // Aggregate duplicate words and count frequencies (preserving first-seen order)
      const freqMap = new Map();
      const firstSeenOrder = [];
      words.forEach((w) => {
        if (!freqMap.has(w)) {
          freqMap.set(w, 1);
          firstSeenOrder.push(w);
        } else {
          freqMap.set(w, freqMap.get(w) + 1);
        }
      });

      const totalUnique = firstSeenOrder.length;
      const counts = Array.from(freqMap.values());
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);

      const customWords = firstSeenOrder.map((word, idx) => {
        const count = freqMap.get(word);
        let size;
        if (totalUnique === 1) {
          // Single unique word scales directly with frequency
          size = Math.min(145, 78 + (count - 1) * 22);
        } else {
          // Dynamic sizing based on frequency:
          const baseSize = totalUnique <= 3 ? 48 : totalUnique <= 6 ? 42 : totalUnique <= 12 ? 34 : 26;
          if (maxCount === minCount) {
            // All words have equal frequency
            size = Math.min(110, baseSize + (count - 1) * 20);
          } else {
            // Sizing scales proportionally with frequency between baseSize and maxTargetSize
            const maxTargetSize = Math.min(130, baseSize + (maxCount - 1) * 26);
            const ratio = (count - minCount) / (maxCount - minCount);
            size = baseSize + ratio * (maxTargetSize - baseSize);
          }
        }

        return {
          id: `cw-${word}`,
          text: word,
          size: Math.round(size),
          color: CLOUD_PALETTE[idx % CLOUD_PALETTE.length],
          count,
        };
      });

      return <WordCloudPreview customWords={customWords} />;
    }

    if (isOpen) {
      // Re-use hovered preview component when test responses switch is ON
      if (showTestResponses && !isResultsHidden) {
        return <OpenEndedPreview />;
      }

      const responses = userSubmissions[currentSlide.id]?.responses || [];
      if (responses.length === 0) {
        return <div className="presenter-empty-canvas" />;
      }

      // Partition into 3 columns so each pill has ~1/3 of canvas width
      const col1 = responses.filter((_, i) => i % 3 === 0);
      const col2 = responses.filter((_, i) => i % 3 === 1);
      const col3 = responses.filter((_, i) => i % 3 === 2);

      return (
        <div className="open-ended-grid-preview">
          <div className="oe-column">
            {col1.map((text, idx) => (
              <div key={idx} className="oe-response-card">
                {text}
              </div>
            ))}
          </div>
          <div className="oe-column">
            {col2.map((text, idx) => (
              <div key={idx} className="oe-response-card">
                {text}
              </div>
            ))}
          </div>
          <div className="oe-column">
            {col3.map((text, idx) => (
              <div key={idx} className="oe-response-card">
                {text}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isQa) {
      // Re-use hovered preview component when test responses switch is ON
      if (showTestResponses && !isResultsHidden) {
        return <QaPreview topic={slideTitle || "Ask me anything"} />;
      }

      const questions = userSubmissions[currentSlide.id]?.questions || [];
      if (questions.length === 0) {
        return (
          <div className="qa-empty-state">
            <h2 className="qa-empty-title">No questions from the audience!</h2>
            <p className="qa-empty-subtitle">
              Incoming questions will show up here so that you can answer them one by one.
            </p>
          </div>
        );
      }

      return (
        <QaPreview
          customQuestions={questions}
          topic={slideTitle || "Ask me anything"}
          onToggleAnswered={handleToggleQuestionAnswered}
        />
      );
    }

    return null;
  };

  // Render Participant Screen Phone Body
  const renderParticipantContent = () => {
    const isMcq = currentSlide.type === 'mcq';
    const isCloud = currentSlide.type === 'word-cloud';
    const isOpen = currentSlide.type === 'open-ended';
    const isQa = currentSlide.type === 'qa';

    if (isMcq) {
      const options = currentSlide.options && currentSlide.options.length > 0
        ? currentSlide.options
        : [
            { id: 1, label: '' },
            { id: 2, label: '' },
            { id: 3, label: '' },
          ];

      const isMulti = slideMaxResponses !== 1;
      const submission = userSubmissions[currentSlide.id];
      const isSubmitted = !!submission?.selectedOptionIndices?.length;

      const handleSelectOption = (i) => {
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

      if (!isSubmitted && !testResponses) {
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

      // Sent state (preview_mcq_sent.png)
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

    if (isCloud) {
      const words = userSubmissions[currentSlide.id]?.words || [];
      const isLimitReached = slideMaxResponses !== 'unlimited' && words.length >= slideMaxResponses;

      const helperMessage = () => {
        if (isLimitReached) {
          return `You have reached the response limit (${words.length}/${slideMaxResponses})`;
        }
        if (slideMaxResponses === 'unlimited') {
          return 'You may submit multiple responses';
        }
        if (words.length > 0) {
          return `You may submit up to ${slideMaxResponses} responses (${slideMaxResponses - words.length} left)`;
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
          {words.length > 0 && (
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

    if (isOpen) {
      const responses = userSubmissions[currentSlide.id]?.responses || [];
      const isLimitReached = slideMaxResponses !== 'unlimited' && responses.length >= slideMaxResponses;

      const helperMessage = () => {
        if (isLimitReached) {
          return `You have reached the response limit (${responses.length}/${slideMaxResponses})`;
        }
        if (slideMaxResponses === 'unlimited') {
          return 'You may submit multiple responses';
        }
        if (responses.length > 0) {
          return `You may submit up to ${slideMaxResponses} responses (${slideMaxResponses - responses.length} left)`;
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
          {responses.length > 0 && (
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

    if (isQa) {
      const questions = userSubmissions[currentSlide.id]?.questions || [];

      // Sort questions based on active dropdown filter
      const sortedQuestions = [...questions].sort((a, b) => {
        if (qaFilter === 'Top') {
          return (b.likes || 0) - (a.likes || 0);
        }
        return (b.id || 0) - (a.id || 0);
      });

      if (questions.length === 0 || qaViewMode === 'input') {
        return (
          <div className="phone-qa-sheet">
            <div className="phone-qa-sheet-top">
              <span className="phone-qa-sheet-title">Q&A</span>
              {questions.length > 0 && (
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

  const isLiked = !!participantLikes[currentSlide.id];

  if (isPresentationMode) {
    return (
      <div
        className="presentation-mode-fullscreen"
        onMouseMove={handleUserActivity}
        onMouseEnter={handleUserActivity}
      >
        {/* Top-Left Controls: Close & Fullscreen */}
        <div className={`pres-top-left-controls ${isControlsVisible ? 'visible' : ''}`}>
          <button className="pres-circle-btn" onClick={handleClose} title="Exit presentation (Esc)">
            <Icon name="close" size={16} />
          </button>
          <button
            className="pres-circle-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            <Icon name={isFullscreen ? 'compress' : 'expand'} size={16} />
          </button>
        </div>

        {/* Top-Right Logo */}
        <div className="pres-top-right-logo">
          <MentiLogo size={24} />
        </div>

        {/* Presentation Slide Canvas */}
        <div className="pres-stage-container">
          <SlideScaler pad={0} maxScale={2}>
            <div className={`host-slide pres-slide ${isQrOpen ? 'with-qr' : 'without-qr'}`}>
              {/* Slide Title - Render only if exists and not Q&A */}
              {slideTitle && currentSlide.type !== 'qa' ? (
                <div className="host-slide-title-wrapper">
                  <h1 className="host-slide-title">{slideTitle}</h1>
                </div>
              ) : null}

              {/* Body Canvas */}
              <div className="slide-body">
                {renderPresenterContent(false)}
              </div>

              {/* Floating Reactions Overlay */}
              {renderReactionsOverlay()}
            </div>
          </SlideScaler>
        </div>

        {/* Timer Widget in Presentation Mode (Absolute position, completely independent of QR) */}
        {isTimerOpen && renderTimerWidget('pres-timer-widget')}

        {/* QR Code Column on Right (Fixed to screen right edge, matching ref.png) */}
        <div className={`pres-qr-column ${isQrOpen ? 'visible' : 'hidden'}`}>
          <div className="qr-overlay-box pres-qr-box">
            <button
              className="qr-close-btn"
              onClick={() => setIsQrOpen(false)}
              title="Close QR Code (i)"
            >
              ×
            </button>
            <div className="qr-code-placeholder pres-qr-code-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=560x560&data=${encodeURIComponent(dynamicJoinUrl)}`}
                alt="QR Code"
                width="280"
                height="280"
              />
            </div>
            <div className="qr-url pres-qr-url">menti.com</div>
            <div className="qr-code-num pres-qr-code-num">{joinCode}</div>
          </div>

          <div className="pres-waiting-pill">
            {submissionCount > 0 ? `${submissionCount} joined` : 'Waiting for participants'}
          </div>
        </div>

        {/* Bottom-Left Controls: Prev, Next (Lightbulb removed!) */}
        <div className="pres-bottom-left-controls">
          <button
            className="pres-circle-btn"
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            title="Previous slide (←)"
          >
            ←
          </button>
          <button
            className="pres-circle-btn"
            onClick={handleNext}
            title={currentSlideIndex === deck.length - 1 ? 'End presentation' : 'Next slide (→)'}
          >
            →
          </button>
        </div>

        {/* Floating Pill Toolbar (Center Bottom: ONLY Timer, QR, and Hide results) */}
        <div className={`pres-floating-toolbar ${isControlsVisible ? 'visible' : ''}`}>
          <button
            className={`pres-tool-btn ${isTimerOpen ? 'active' : ''}`}
            onClick={() => setIsTimerOpen((prev) => !prev)}
            title="Timer"
          >
            <Icon name="timer" size={19} />
          </button>
          <div className="pres-qr-btn-container">
            <button
              className={`pres-tool-btn ${isQrOpen ? 'active' : ''}`}
              onClick={() => setIsQrOpen((prev) => !prev)}
              title="Show joining instructions (i)"
            >
              <Icon name="qr" size={19} />
              {isQrOpen && <span className="pres-tool-active-dot" />}
            </button>
            <div className="pres-qr-tooltip">
              {isQrOpen ? 'Hide joining instructions' : 'Show joining instructions'}{' '}
              <span className="pres-tooltip-key">I</span>
            </div>
          </div>
          <button
            className={`pres-tool-btn ${isResultsHidden ? 'active' : ''}`}
            onClick={() => setIsResultsHidden((prev) => !prev)}
            title={isResultsHidden ? 'Show results (h)' : 'Hide results (h)'}
          >
            <Icon name="eyeSlash" size={19} />
          </button>
        </div>

        {/* Bottom-Right info when QR is closed (matching image2.png) */}
        <div className={`pres-bottom-right-info ${!isQrOpen ? 'visible' : 'hidden'}`}>
          <span className="pres-join-text">
            Join at <strong>menti.com</strong> <strong>{joinCode}</strong>
          </span>
          <div className="pres-user-badge">
            <Icon name="users" size={16} />
            <span>{submissionCount}</span>
          </div>
        </div>

        {/* Slide Progress Bar across bottom */}
        <div
          className="pres-progress-bar"
          style={{
            width: `${((currentSlideIndex + 1) / Math.max(deck.length, 1)) * 100}%`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="presentation-preview-overlay">
      <div className="presentation-preview-modal">
        {/* Yellow Header */}
        <div className="preview-header">
          <div className="preview-header-left">
            <span className="toggle-label">Show test responses</span>
            <button
              className={`toggle-switch ${testResponses ? 'on' : 'off'}`}
              onClick={() => setTestResponses(!testResponses)}
              aria-label="Toggle test responses"
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <div className="preview-header-center">
            Test your presentation — responses will not be saved.
          </div>
          <button className="preview-close-btn" onClick={onClose} title="Close preview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="preview-body">
          {/* Host Screen Column */}
          <div className="preview-column host-column">
            <div className="preview-column-title">
              Your screen
              <Icon name="settings" size={14} className="info-icon" />
            </div>

            <div
              className="host-screen-container"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <SlideScaler pad={0}>
                <div className={`host-slide ${isQrOpen ? 'with-qr' : 'without-qr'}`}>
                  {/* Top-right Mentimeter Logo */}
                  <MentiLogo size={24} className="host-slide-logo" />

                  {/* Slide Title - Render only if exists and not Q&A */}
                  {slideTitle && currentSlide.type !== 'qa' ? (
                    <div className="host-slide-title-wrapper">
                      <h1 className="host-slide-title">{slideTitle}</h1>
                    </div>
                  ) : null}

                  {/* Body Canvas */}
                  <div className="slide-body">
                    {renderPresenterContent()}
                  </div>

                  {/* Floating Reactions Overlay */}
                  {renderReactionsOverlay()}

                  {/* Timer Widget in Host Preview (Absolute position, completely independent of QR) */}
                  {isTimerOpen && renderTimerWidget('host-preview-timer')}

                  {/* QR Overlay Box (Vertically Aligned) or Compact Footer */}
                  {isQrOpen ? (
                    <div className="host-qr-column">
                      <div className="qr-overlay-box">
                        <button
                          className="qr-close-btn"
                          onClick={() => setIsQrOpen(false)}
                          title="Close QR Code"
                        >
                          ×
                        </button>
                        <div className="qr-code-placeholder">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(dynamicJoinUrl)}`}
                            alt="QR Code"
                            width="180"
                            height="180"
                          />
                          <div className="qr-test-badge">TEST</div>
                        </div>
                        <div className="qr-url">menti.com</div>
                        <div className="qr-code-num">{joinCode}</div>
                      </div>

                      <div className="response-count-overlay">
                        {currentSlide.type === 'qa' ? (
                          <div className="qa-joined-count">
                            <strong>{hasResponse ? '1' : '0'}</strong> joined
                          </div>
                        ) : (
                          <>
                            <div className="response-count-text">
                              <strong>{hasResponse ? Math.max(submissionCount, 1) : '0'}</strong> of <strong>1</strong> responded
                            </div>
                            <div className="progress-bar-track">
                              <div
                                className="progress-bar-fill"
                                style={{ width: hasResponse ? '100%' : '0%' }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="host-slide-compact-footer">
                      <span className="compact-join-text">
                        Join at <strong>menti.com</strong> <strong>{joinCode}</strong>
                      </span>
                      <span className={`compact-user-pill ${hasResponse ? 'active' : ''}`}>
                        <Icon name="user" size={13} />
                        {hasResponse ? `${Math.max(submissionCount, 1)}/1` : '0/1'}
                      </span>
                    </div>
                  )}

                  {/* Hover Floating Toolbar (Bottom Center: ONLY Timer & QR buttons) */}
                  <div className={`host-hover-toolbar ${isHovered ? 'visible' : ''}`}>
                    <button
                      className={`preview-hover-btn ${isTimerOpen ? 'active' : ''}`}
                      onClick={() => setIsTimerOpen((prev) => !prev)}
                      title="Toggle Timer"
                    >
                      <Icon name="timer" size={20} />
                    </button>
                    <button
                      className={`preview-hover-btn ${isQrOpen ? 'active' : ''}`}
                      onClick={() => setIsQrOpen((prev) => !prev)}
                      title="Toggle QR Code"
                    >
                      <Icon name="qr" size={20} />
                      {isQrOpen && <span className="hover-btn-dot" />}
                    </button>
                  </div>

                  {/* Left Controls: Navigation & Presentation end */}
                  <div className="host-controls-left">
                    <button
                      className="host-nav-btn"
                      onClick={handlePrev}
                      disabled={currentSlideIndex === 0}
                      title="Previous slide"
                    >
                      ←
                    </button>
                    {currentSlideIndex === deck.length - 1 ? (
                      <button
                        className="host-nav-btn host-nav-end-btn"
                        onClick={onClose}
                        title="End presentation"
                      >
                        → End presentation
                      </button>
                    ) : (
                      <button
                        className="host-nav-btn"
                        onClick={handleNext}
                        title="Next slide"
                      >
                        →
                      </button>
                    )}

                  </div>

                  {/* Slide Progress Bar across bottom */}
                  <div
                    className="host-slide-progress-bar"
                    style={{
                      width: `${((currentSlideIndex + 1) / Math.max(deck.length, 1)) * 100}%`,
                    }}
                  />
                </div>
              </SlideScaler>
            </div>
          </div>

          {/* Participant's Screen Column */}
          <div className="preview-column participant-column">
            <div className="preview-column-title">
              Participant's screen
              <Icon name="help" size={15} className="info-icon" />
            </div>

            <div className={`participant-phone-frame ${currentSlide.type === 'qa' ? 'qa-phone-mode' : ''}`}>
              {currentSlide.type === 'qa' ? (
                <div className="phone-qa-backdrop">
                  <MentiLogo size={24} />
                </div>
              ) : (
                <div className="phone-header">
                  <MentiLogo size={20} />
                </div>
              )}

              {/* Dynamic content per slide type */}
              {renderParticipantContent()}

              {/* Thumbs up reaction */}
              {currentSlide.type !== 'qa' && (
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
              {currentSlide.type !== 'qa' && (
                <div className="phone-footer">
                  <a href="#mentimeter" className="phone-footer-link" onClick={(e) => e.preventDefault()}>
                    Powered by Mentimeter
                  </a>
                  <p className="phone-footer-terms">
                    By using Mentimeter you accept our <u>terms of use</u> and <u>policies</u>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
