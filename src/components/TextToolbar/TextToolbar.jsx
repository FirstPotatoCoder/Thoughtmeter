import "./TextToolbar.css";
import Icon from "../Icon/Icon";

export default function TextToolbar({
  wordCount = 0,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  boldActive = false,
  italicActive = false,
  underlineActive = false,
  strikethroughActive = false,
}) {
  const MAX_CHARS = 150;
  const percentage = Math.min((wordCount / MAX_CHARS) * 100, 100);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const preventClose = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="text-toolbar" onClick={preventClose}>
      <button className="dropdown-btn" onClick={preventClose}>
        Default <Icon name="chevronDown" />
      </button>
      <div className="toolbar-divider" />
      <button
        className={`toolbar-btn ${boldActive ? "active" : ""}`}
        title="Bold"
        onClick={(e) => {
          preventClose(e);
          onBold();
        }}
      >
        <Icon name="bold" />
      </button>
      <button
        className={`toolbar-btn ${italicActive ? "active" : ""}`}
        title="Italic"
        onClick={(e) => {
          preventClose(e);
          onItalic();
        }}
      >
        <Icon name="italic" />
      </button>
      <button
        className={`toolbar-btn ${underlineActive ? "active" : ""}`}
        title="Underline"
        onClick={(e) => {
          preventClose(e);
          onUnderline();
        }}
      >
        <Icon name="underline" />
      </button>
      <button
        className={`toolbar-btn ${strikethroughActive ? "active" : ""}`}
        title="Strikethrough"
        onClick={(e) => {
          preventClose(e);
          onStrikethrough();
        }}
      >
        <Icon name="strikethrough" />
      </button>
      <button className="toolbar-btn" title="Link" onClick={preventClose}>
        <Icon name="link" />
      </button>
      <button
        className="color-picker-btn"
        title="Color"
        onClick={preventClose}
      />
      <button
        className="word-counter-btn"
        title="Character count"
        onClick={preventClose}
      >
        <svg width="36" height="36" viewBox="0 0 40 40">
          {/* <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="#E8E8E8"
            strokeWidth="3"
          /> */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="#6B5CFF"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            className="progress-circle"
          />
          <text
            x="20"
            y="21"
            textAnchor="middle"
            dominantBaseline="middle"
            className="word-counter-text"
          >
            {wordCount}
          </text>
        </svg>
      </button>
    </div>
  );
}
