import { useState, useEffect } from 'react';
import './TopBar.css';
import Icon from '../Icon/Icon';
import { getSlideDeck, subscribeSlideSettings, setViewMode } from '../../utils/slideSettings';

export default function TopBar({ onPreview }) {
  const [activeTab, setActiveTab] = useState('create');
  const [deck, setDeck] = useState(getSlideDeck);

  useEffect(() => {
    return subscribeSlideSettings(() => setDeck(getSlideDeck()));
  }, []);

  const isDeckEmpty = deck.length === 0;

  const handleOpenPreview = () => {
    setViewMode('preview');
    onPreview?.();
  };

  const handleStartPresentation = () => {
    setViewMode('presentation');
    onPreview?.();
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button className="icon-btn-icon" title="Back">
          <Icon name="back" />
        </button>
        <div className="title-section">
          <span className="title">Sample</span>
          <div className="subtitle">
            <Icon name="user" />
            My Mentis
            <Icon name="chevronDown" />
          </div>
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
          title={isDeckEmpty ? "Add a slide to preview" : "Preview"}
        >
          Preview
        </button>
        <button
          className="btn-start-presentation"
          disabled={isDeckEmpty}
          onClick={handleStartPresentation}
          title={isDeckEmpty ? "Add a slide to start presentation" : "Start presentation"}
        >
          Start presentation
          <Icon name="chevronDown" />
        </button>
      </div>
    </header>
  );
}
