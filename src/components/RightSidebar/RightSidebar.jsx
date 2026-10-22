import { useState, useEffect } from 'react';
import './RightSidebar.css';
import IconButton from '../IconButton/IconButton';
import Icon from '../Icon/Icon';
import {
  subscribeSlideSettings,
  getActiveSlide,
  getSlideSetting,
  setSlideSetting,
  getDefaultMaxResponses,
} from '../../utils/slideSettings';

const ICONS = ['sparkle', 'pencil', 'chat', 'hand', 'presentation', 'slides'];
const TITLES = ['AI Suggestions', 'Edit', 'Comments', 'Raise Hand', 'Present', 'Slides'];

export default function RightSidebar() {
  const [activeIcon, setActiveIcon] = useState(1); // Open 'Edit' by default so user sees the new settings drawer
  const [activeSlide, setActiveSlideState] = useState(getActiveSlide());
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeSlideSettings(() => {
      setActiveSlideState(getActiveSlide());
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const handleIconClick = (index) => {
    setActiveIcon((prev) => (prev === index ? null : index));
  };

  const slideType = activeSlide?.type;
  const slideId = activeSlide?.id;

  const currentMaxResponses = slideId
    ? getSlideSetting(slideId, 'maxResponses', getDefaultMaxResponses(slideType), slideType)
    : getDefaultMaxResponses(slideType);

  const handleSelectMaxResponses = (val) => {
    setSlideSetting(slideId, 'maxResponses', val, slideType);
  };

  const getSlideTypeName = (type) => {
    switch (type) {
      case 'word-cloud':
        return 'Word Cloud';
      case 'mcq':
        return 'Multiple Choice';
      case 'open-ended':
        return 'Open-ended';
      case 'qa':
        return 'Q&A';
      default:
        return 'Slide';
    }
  };

  const getResponsesDescription = (type) => {
    switch (type) {
      case 'word-cloud':
        return 'How many words each audience member can submit.';
      case 'open-ended':
        return 'How many responses each audience member can submit.';
      case 'mcq':
        return 'How many options each audience member can choose.';
      default:
        return 'Limit how many responses each audience member can submit.';
    }
  };

  const getResponsesHelpNote = (val) => {
    if (val === 1) return 'Participants can only submit once.';
    if (val === 'unlimited') return 'Participants can submit unlimited times.';
    return `Participants can submit up to ${val} times.`;
  };

  const isSupportedType = ['word-cloud', 'open-ended', 'mcq'].includes(slideType);

  return (
    <div className="right-sidebar-wrapper">
      {/* Slide Settings Inspector Drawer (Option A: Opens when Edit/pencil is active) */}
      {activeIcon === 1 && (
        <aside className="slide-inspector-drawer">
          <div className="inspector-header">
            <div className="inspector-header-left">
              <Icon name="pencil" size={16} />
              <span className="inspector-title">Slide settings</span>
            </div>
            <button
              className="inspector-close-btn"
              onClick={() => setActiveIcon(null)}
              title="Close settings"
            >
              ×
            </button>
          </div>

          <div className="inspector-content">
            {activeSlide ? (
              <>
                <div className="inspector-slide-badge">
                  <span className="badge-dot" />
                  <span className="badge-type">{getSlideTypeName(slideType)}</span>
                </div>

                {isSupportedType ? (
                  <div className="inspector-section">
                    <div className="section-header">
                      <span className="section-title">Responses per participant</span>
                      <p className="section-desc">
                        {getResponsesDescription(slideType)}
                      </p>
                    </div>

                    <div className="segmented-control">
                      {[1, 2, 3, 'unlimited'].map((optionVal) => {
                        const isSelected = currentMaxResponses === optionVal;
                        return (
                          <button
                            key={optionVal}
                            type="button"
                            className={`segment-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelectMaxResponses(optionVal)}
                          >
                            {optionVal === 'unlimited' ? 'Unlimited' : optionVal}
                          </button>
                        );
                      })}
                    </div>

                    <div className="response-help-box">
                      <Icon name="settings" size={14} className="help-info-icon" />
                      <span>{getResponsesHelpNote(currentMaxResponses)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="inspector-info-card">
                    <p>Q&A slides allow audience members to submit and upvote questions continuously.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="inspector-empty-state">
                <p>Select a slide on the left to configure its participant response settings.</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Right Sidebar Vertical Icon Strip */}
      <aside className="right-sidebar">
        {ICONS.map((icon, index) => (
          <IconButton
            key={icon}
            icon={icon}
            active={index === activeIcon}
            title={TITLES[index]}
            onClick={() => handleIconClick(index)}
          />
        ))}
      </aside>
    </div>
  );
}
