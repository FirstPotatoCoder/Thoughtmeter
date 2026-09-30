import './SlideThumbnail.css';
import { MCQ_COLORS } from '../../palette';

export default function SlideThumbnail({
  number,
  type = 'wordcloud',
  questionText = '',
  active = false,
  onClick,
}) {
  return (
    <div className="slide-thumbnail">
      <span className="slide-number">{number}</span>
      <div
        className={`slide-preview ${active ? 'active' : ''}`}
        onClick={onClick}
      >
        {type === 'mcq' ? (
          <div className="thumb-bars">
            {MCQ_COLORS.slice(0, 3).map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
        ) : (
          <span className="thumb-question">
            {questionText || 'What word comes to mind...'}
          </span>
        )}
        <span className="slide-label">MP</span>
      </div>
    </div>
  );
}
