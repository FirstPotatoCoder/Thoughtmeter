import { useState } from 'react';
import './LeftSidebar.css';
import SlideThumbnail from '../SlideThumbnail/SlideThumbnail';
import NewSlideMenu from './NewSlideMenu';

export default function LeftSidebar({
  onPreviewSlide,
  slides,
  activeSlideId,
  onSelectSlide,
  onSelectOption,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      onPreviewSlide?.(null);
    } else {
      setMenuOpen(true);
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    onPreviewSlide?.(null);
  };

  return (
    <aside className="left-sidebar">
      <div className="new-slide-wrapper">
        <button className="btn-new-slide" onClick={toggleMenu}>
          + New slide
        </button>
        {menuOpen && (
          <NewSlideMenu
            onClose={closeMenu}
            onHoverOption={onPreviewSlide}
            onSelectOption={onSelectOption}
          />
        )}
      </div>
      {slides.map((slide, index) => (
        <SlideThumbnail
          key={slide.id}
          number={index + 1}
          type={slide.type}
          questionText={slide.questionHtml?.replace(/<[^>]*>/g, '')}
          active={slide.id === activeSlideId}
          onClick={() => onSelectSlide(slide.id)}
        />
      ))}
    </aside>
  );
}
