import './WordCloud.css';

const WORDS = [
  { text: 'fast', className: 'word-fast' },
  { text: 'bold', className: 'word-bold' },
  { text: 'creative', className: 'word-creative' },
  { text: 'inspiration', className: 'word-inspiration' },
  { text: 'leader', className: 'word-leader' },
  { text: 'focus', className: 'word-focus' },
  { text: 'transpiration', className: 'word-transpiration' },
];

export default function WordCloud() {
  return (
    <div className="word-cloud">
      {WORDS.map((word, index) => (
        <span key={index} className={`word ${word.className}`}>
          {word.text}
        </span>
      ))}
    </div>
  );
}
