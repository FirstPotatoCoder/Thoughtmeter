import { useEffect, useRef } from "react";
import "./NewSlideMenu.css";

// Icon fills reference palette vars defined in index.css.
function McqIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-hidden="true">
      <rect x="18.7202" y="8" width="5.44" height="16" fill="var(--palette-blue-500)" />
      <rect x="13.28" y="13.4399" width="5.44" height="10.56" fill="var(--palette-blue-500)" />
      <rect x="7.84009" y="18.7202" width="5.44" height="5.28" fill="var(--palette-blue-500)" />
    </svg>
  );
}

function WordCloudIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-hidden="true">
      <g fill="var(--palette-coral-500)">
        <circle cx="19.7096" cy="19.5011" r="4.23548" />
        <rect x="11.239" y="16.0132" width="8.96925" height="5.48121" />
        <circle cx="12.2355" cy="19.5011" r="4.23548" />
        <circle cx="19.7096" cy="12.0265" r="4.23548" />
        <rect x="13.2322" y="10.5317" width="4.98292" height="5.48121" />
        <circle cx="12.2355" cy="12.0265" r="4.23548" />
        <circle cx="14.976" cy="15.7638" r="4.23548" />
        <rect x="19.2847" y="11.5283" width="5.48121" height="5.9795" transform="rotate(90 19.2847 11.5283)" />
        <circle cx="17.4677" cy="15.7638" r="4.23548" />
      </g>
    </svg>
  );
}

function OpenEndedIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-hidden="true">
      <path
        d="M8.32007 15.9998C8.32007 11.7583 11.7585 8.31982 16.0001 8.31982C20.2416 8.31982 23.6801 11.7583 23.6801 15.9998C23.6801 20.2414 20.2416 23.6798 16.0001 23.6798H8.32007V15.9998Z"
        fill="var(--palette-coral-300)"
      />
    </svg>
  );
}

function QaIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-hidden="true">
      <g fill="var(--palette-coral-300)">
        <path d="M16.3201 20.7999C16.3201 23.3625 18.3975 25.4399 20.9601 25.4399H25.6001V20.7999C25.6001 18.2373 23.5227 16.1599 20.9601 16.1599C18.3975 16.1599 16.3201 18.2373 16.3201 20.7999Z" />
        <path d="M17.9199 12.1599C17.9199 15.3411 15.3411 17.9199 12.1599 17.9199H6.39992V12.1599C6.39992 8.97876 8.97876 6.39992 12.1599 6.39992C15.3411 6.39992 17.9199 8.97876 17.9199 12.1599Z" />
      </g>
    </svg>
  );
}

const OPTIONS = [
  { id: "mcq", label: "MCQ", Icon: McqIcon },
  { id: "word-cloud", label: "Word Cloud", Icon: WordCloudIcon },
  { id: "open-ended", label: "Open Ended", Icon: OpenEndedIcon },
  { id: "qa", label: "Q&A", Icon: QaIcon },
];

export default function NewSlideMenu({ onClose, onHoverOption, onSelectOption }) {
  const ref = useRef(null);

  // Close when clicking anywhere outside the panel.
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  const handleSelect = (id) => {
    onSelectOption?.(id);
    onClose();
  };

  // Moving off the whole menu clears any active preview.
  const handleMenuMouseLeave = () => {
    onHoverOption?.(null);
  };

  return (
    <div className="new-slide-menu" ref={ref} role="menu" onMouseLeave={handleMenuMouseLeave}>
      <div className="new-slide-menu-header">
        <span className="new-slide-menu-title">Interactive questions</span>
        <button className="new-slide-menu-close" title="Close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="new-slide-menu-grid">
        {OPTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className="new-slide-menu-item"
            role="menuitem"
            onClick={() => handleSelect(id)}
            onMouseEnter={() =>
              onHoverOption?.(
                id === "mcq" || id === "word-cloud" || id === "open-ended"
                  ? id
                  : null
              )
            }
          >
            <span className="new-slide-menu-item-icon">
              <Icon />
            </span>
            <span className="new-slide-menu-item-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
