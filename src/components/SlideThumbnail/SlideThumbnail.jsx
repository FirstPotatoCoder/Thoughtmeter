import './SlideThumbnail.css';
import { MCQ_COLORS } from '../../palette';

export default function SlideThumbnail({
  number,
  type = 'word-cloud',
  questionText = '',
  active = false,
  onClick,
  onDelete,
}) {
  const getDefaultQuestion = (slideType) => {
    switch (slideType) {
      case 'mcq':
        return 'Which of these...';
      case 'word-cloud':
        return 'What word comes to mind...';
      case 'open-ended':
        return 'Ask a question...';
      case 'qa':
        return 'Ask me anything!';
      default:
        return 'Untitled slide';
    }
  };

  const hasCustomTitle = Boolean(questionText?.trim());
  const displayTitle = hasCustomTitle ? questionText.trim() : getDefaultQuestion(type);

  return (
    <div className="slide-thumbnail">
      <span className="slide-number">{number}</span>
      <div
        className={`slide-preview ${active ? 'active' : ''}`}
        onClick={onClick}
      >
        {onDelete && (
          <button
            className="thumbnail-delete-btn"
            title="Delete slide"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dynamic slide title / question displayed across all 4 slide types */}
        <span className={`thumb-question ${!hasCustomTitle ? 'placeholder' : ''}`} title={displayTitle}>
          {displayTitle}
        </span>

        {/* 1. MCQ: Rising bar chart icons with varying heights */}
        {type === 'mcq' && (
          <div className="thumb-mcq-bars">
            <span className="thumb-bar" style={{ height: '14px', background: MCQ_COLORS[0] }} />
            <span className="thumb-bar" style={{ height: '26px', background: MCQ_COLORS[1] }} />
            <span className="thumb-bar" style={{ height: '18px', background: MCQ_COLORS[2] }} />
          </div>
        )}

        {/* 2. Word Cloud: Cloud-like organic cluster */}
        {type === 'word-cloud' && (
          <div className="thumb-word-cloud">
            <span className="thumb-wc-word w-fast">fast</span>
            <span className="thumb-wc-word w-creative">creative</span>
            <span className="thumb-wc-word w-bold">bold</span>
            <span className="thumb-wc-word w-focus">focus</span>
          </div>
        )}

        {/* 3. Open Ended: 1 row and 3 columns of gray response bubbles */}
        {type === 'open-ended' && (
          <div className="thumb-open-ended">
            <div className="thumb-oe-card">
              <div className="thumb-line full" />
              <div className="thumb-line half" />
            </div>
            <div className="thumb-oe-card">
              <div className="thumb-line full" />
              <div className="thumb-line three-quarter" />
            </div>
            <div className="thumb-oe-card">
              <div className="thumb-line full" />
              <div className="thumb-line half" />
            </div>
          </div>
        )}

        {/* 4. Q&A: Audience question card with upvotes */}
        {type === 'qa' && (
          <div className="thumb-qa">
            <div className="thumb-qa-card">
              <div className="thumb-qa-header">
                <span className="thumb-qa-dot" />
                <div className="thumb-line full" />
              </div>
              <div className="thumb-qa-footer">
                <svg className="thumb-qa-thumb" width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.88 0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.45-.08-.66a1.002 1.002 0 0 0-.75-.62l-.7-.07-6.06 6.13c-.21.2-.33.48-.33.78V18c0 1.1.9 2 2 2h8c.82 0 1.55-.5 1.86-1.26l2.47-5.86z" />
                </svg>
                <span className="thumb-qa-count">8</span>
              </div>
            </div>
          </div>
        )}

        <span className="slide-label">MP</span>
      </div>
    </div>
  );
}
