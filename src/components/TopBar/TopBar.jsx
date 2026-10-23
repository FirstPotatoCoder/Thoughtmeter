import { useState, useEffect, useRef } from 'react';
import './TopBar.css';
import Icon from '../Icon/Icon';
import { getSlideDeck, subscribeSlideSettings, setViewMode } from '../../utils/slideSettings';
import { exportDeckAsJson } from '../../utils/deckStorage';

export default function TopBar({
  onPreview,
  deckTitle = 'Sample presentation',
  currentDeckId,
  allDecks = [],
  onRenameDeck,
  onSwitchDeck,
  onCreateDeck,
  onDuplicateDeck,
  onDeleteDeck,
  onImportDeck,
}) {
  const [activeTab, setActiveTab] = useState('create');
  const [deck, setDeck] = useState(getSlideDeck);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(deckTitle);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return subscribeSlideSettings(() => setDeck(getSlideDeck()));
  }, []);

  useEffect(() => {
    setTempTitle(deckTitle);
  }, [deckTitle]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const isDeckEmpty = deck.length === 0;

  const handleOpenPreview = () => {
    setViewMode('preview');
    onPreview?.();
  };

  const handleStartPresentation = () => {
    setViewMode('presentation');
    onPreview?.();
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== deckTitle) {
      onRenameDeck?.(trimmed);
    } else {
      setTempTitle(deckTitle);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        onImportDeck?.(evt.target.result);
        setIsDropdownOpen(false);
      } catch (err) {
        alert('Could not import file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button className="icon-btn-icon" title="Back">
          <Icon name="back" />
        </button>

        <div className="title-section" ref={dropdownRef}>
          {isEditingTitle ? (
            <input
              className="title-input"
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(deckTitle);
                  setIsEditingTitle(false);
                }
              }}
            />
          ) : (
            <span
              className="title"
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename presentation"
            >
              {deckTitle || 'Untitled presentation'}
            </span>
          )}

          <div
            className={`subtitle ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            title="My Presentations"
          >
            <Icon name="user" />
            My Mentis
            <Icon name="chevronDown" />
          </div>

          {/* Decks Switcher Dropdown */}
          {isDropdownOpen && (
            <div className="deck-switcher-dropdown">
              <div className="deck-dropdown-header">
                <span className="deck-dropdown-title">
                  My presentations ({allDecks.length})
                </span>
                <div className="deck-dropdown-actions">
                  <button
                    className="deck-action-btn primary"
                    onClick={() => {
                      onCreateDeck?.();
                      setIsDropdownOpen(false);
                    }}
                    title="Create new presentation"
                  >
                    <Icon name="plus" size={12} />
                    New
                  </button>
                  <button
                    className="deck-action-btn secondary"
                    onClick={() => fileInputRef.current?.click()}
                    title="Import presentation from JSON"
                  >
                    <Icon name="upload" size={12} />
                    Import
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="deck-dropdown-list">
                {allDecks.map((d) => {
                  const isActive = d.id === currentDeckId;
                  const slideCount = d.slides?.length || 0;
                  return (
                    <div
                      key={d.id}
                      className={`deck-dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSwitchDeck?.(d.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="deck-item-info">
                        <div className="deck-item-title-row">
                          {isActive && (
                            <span className="deck-active-check">
                              <Icon name="check" size={14} />
                            </span>
                          )}
                          <span className="deck-item-title">{d.title}</span>
                        </div>
                        <span className="deck-item-meta">
                          {slideCount} slide{slideCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div
                        className="deck-item-buttons"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="deck-icon-btn"
                          title="Duplicate presentation"
                          onClick={() => {
                            onDuplicateDeck?.(d.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Icon name="copy" size={14} />
                        </button>
                        <button
                          className="deck-icon-btn"
                          title="Export as JSON"
                          onClick={() => exportDeckAsJson(d.id)}
                        >
                          <Icon name="download" size={14} />
                        </button>
                        {allDecks.length > 1 && (
                          <button
                            className="deck-icon-btn danger"
                            title="Delete presentation"
                            onClick={() => {
                              if (window.confirm(`Delete "${d.title}"?`)) {
                                onDeleteDeck?.(d.id);
                              }
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button className="icon-btn-icon" title="Settings">
          <Icon name="settings" />
        </button>
      </div>

      <nav className="top-bar-center">
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results <span className="results-badge">0</span>
        </button>
      </nav>

      <div className="top-bar-right">
        <div className="avatar">MP</div>
        <button
          className="btn-preview"
          disabled={isDeckEmpty}
          onClick={handleOpenPreview}
          title={isDeckEmpty ? 'Add a slide to preview' : 'Preview'}
        >
          Preview
        </button>
        <button
          className="btn-start-presentation"
          disabled={isDeckEmpty}
          onClick={handleStartPresentation}
          title={isDeckEmpty ? 'Add a slide to start presentation' : 'Start presentation'}
        >
          Start presentation
          <Icon name="chevronDown" />
        </button>
      </div>
    </header>
  );
}
