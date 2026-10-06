import React, { useState } from 'react';
import './PresentationPreview.css';
import Icon from '../Icon/Icon';
import SlideScaler from '../EditorArea/SlideScaler';
import WordCloudPreview from '../EditorArea/WordCloudPreview';
import McqPreview from '../EditorArea/McqPreview';
import OpenEndedPreview from '../EditorArea/OpenEndedPreview';
import QaPreview from '../EditorArea/QaPreview';
import SlideCanvas from '../EditorArea/SlideCanvas';

export default function PresentationPreview({ slide, onClose }) {
  const [testResponses, setTestResponses] = useState(true);

  // Render the appropriate simulated preview based on slide type
  const renderSimulatedContent = () => {
    if (!slide) return null;
    switch (slide.type) {
      case 'word-cloud':
        return <WordCloudPreview customWords={[
          { id: 'hi', text: 'hi', size: 120, color: '#6B5CFF' },
          { id: 'there', text: 'there', size: 120, color: '#F0655A' }
        ]} />;
      case 'mcq':
        return <McqPreview />;
      case 'open-ended':
        return <OpenEndedPreview />;
      case 'qa':
        return <QaPreview />;
      default:
        return null;
    }
  };

  const slideTitle = slide?.questionHtml?.replace(/<[^>]*>/g, '') || "Untitled slide";

  return (
    <div className="presentation-preview-overlay">
      <div className="presentation-preview-modal">
        <div className="preview-header">
          <div className="preview-header-left">
            <span className="toggle-label">Show test responses</span>
            <button 
              className={`toggle-switch ${testResponses ? 'on' : 'off'}`}
              onClick={() => setTestResponses(!testResponses)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <div className="preview-header-center">
            Test your presentation — responses will not be saved.
          </div>
          <button className="preview-close-btn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="preview-body">
          <div className="preview-column host-column">
            <div className="preview-column-title">
              Your screen
              <Icon name="settings" size={14} className="info-icon" />
            </div>
            
            <div className="host-screen-container">
              <SlideScaler>
                <div className="host-slide">
                  <div className="logo-container">
                    <div className="logo-mark" />
                    <span className="logo-text">Mentimeter</span>
                  </div>
                  
                  <div className="host-slide-title-wrapper">
                    <h1 className="host-slide-title">{slideTitle}</h1>
                  </div>

                  <div className="slide-body">
                    {testResponses ? renderSimulatedContent() : null}
                  </div>

                  {/* Presenter UI Overlays */}
                  <div className="qr-overlay-box">
                    <div className="qr-code-placeholder">
                       <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://menti.com" alt="QR Code" width="120" height="120" />
                       <div className="qr-test-badge">TEST</div>
                    </div>
                    <div className="qr-url">menti.com</div>
                    <div className="qr-code-num">7264 5825</div>
                  </div>

                  <div className="response-count-overlay">
                    <strong>1</strong> of <strong>1</strong> responded
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="host-controls-left">
                    <button className="host-nav-btn">←</button>
                    <button className="host-nav-btn">→</button>
                    <button className="host-nav-btn">💡</button>
                  </div>
                </div>
              </SlideScaler>
            </div>
          </div>

          <div className="preview-column participant-column">
            <div className="preview-column-title">
              Participant's screen
              <Icon name="settings" size={14} className="info-icon" />
            </div>
            <div className="participant-phone-frame">
              <div className="phone-header">
                <div className="logo-mark" />
                <span className="logo-text">Mentimeter</span>
              </div>
              
              <div className="phone-body">
                <div className="phone-input-group">
                  <input type="text" className="phone-input" placeholder="Enter a word" defaultValue="hi there" />
                  <span className="phone-char-limit">25</span>
                </div>
                
                <p className="phone-help-text">You may submit multiple responses</p>
                <p className="phone-success-text">Thanks, we received your input!</p>
                
                <button className="phone-submit-btn">Submit</button>
                <button className="phone-next-btn">Next question</button>
              </div>
              
              <div className="phone-bottom-actions">
                <button className="phone-thumbs-btn">
                  <Icon name="thumbsUp" size={20} />
                </button>
              </div>

              <div className="phone-footer">
                <a href="#" className="phone-footer-link">Powered by Mentimeter</a>
                <p className="phone-footer-terms">
                  By using Mentimeter you accept our <u>terms of use</u> and <u>policies</u>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
