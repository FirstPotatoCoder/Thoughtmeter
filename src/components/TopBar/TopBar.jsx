import { useState } from 'react';
import './TopBar.css';
import Icon from '../Icon/Icon';

export default function TopBar() {
  const [activeTab, setActiveTab] = useState('create');

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
        <div className="avatar-group">
          <div className="avatar">MP</div>
          <button className="plus-btn" title="Add">
            <Icon name="plus" />
          </button>
        </div>
        <button className="icon-btn-icon" title="Share">
          <Icon name="share" size={18} />
        </button>
        <button className="btn-preview">Preview</button>
        <button className="btn-start-presentation">
          Start presentation
          <Icon name="chevronDown" />
        </button>
      </div>
    </header>
  );
}
