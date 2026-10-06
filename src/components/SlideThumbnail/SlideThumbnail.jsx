import './SlideThumbnail.css';
import { MCQ_COLORS } from '../../palette';

export default function SlideThumbnail({
  number,
  type = 'wordcloud',
  questionText = '',
  active = false,
  onClick,
  onDelete,
}) {
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
        {type === 'mcq' ? (
          <div className="thumb-bars">
            {MCQ_COLORS.slice(0, 3).map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
        ) : (
          <span className="thumb-question">
            {questionText || (type === 'qa' ? 'Ask me anything!' : 'What word comes to mind...')}
          </span>
        )}
        <span className="slide-label">MP</span>
      </div>
    </div>
  );
}
