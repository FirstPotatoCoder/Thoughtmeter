import './SlideThumbnail.css';

export default function SlideThumbnail({ number = '1', label = 'MP' }) {
  return (
    <div className="slide-thumbnail">
      <span className="slide-number">{number}</span>
      <div className="slide-preview">
        <span className="slide-label">{label}</span>
      </div>
    </div>
  );
}
