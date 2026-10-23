// Store for slide-level configurations (e.g. max responses per participant)

const SETTINGS_KEY = 'simplemeter_slide_settings';

let currentActiveSlide = null;
let currentSlidesDeck = [];
let currentViewMode = 'preview'; // 'preview' | 'presentation'
let listeners = new Set();

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let slideSettings = loadStoredSettings();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeSlideSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActiveSlide() {
  return currentActiveSlide;
}

export function setActiveSlide(slide) {
  currentActiveSlide = slide;
  notify();
}

export function updateActiveSlideDirect(slide) {
  currentActiveSlide = slide;
}

export function getSlideDeck() {
  return currentSlidesDeck;
}

export function setSlideDeck(slides) {
  currentSlidesDeck = Array.isArray(slides) ? slides : [];
  notify();
}

export function updateSlideDeckDirect(slides) {
  currentSlidesDeck = Array.isArray(slides) ? slides : [];
}

export function getViewMode() {
  return currentViewMode;
}

export function setViewMode(mode) {
  currentViewMode = mode;
  notify();
}

export function getDefaultMaxResponses(type) {
  switch (type) {
    case 'word-cloud':
      return 3;
    case 'open-ended':
      return 'unlimited';
    case 'mcq':
      return 1;
    case 'qa':
      return 'unlimited';
    default:
      return 1;
  }
}

export function getSlideSetting(slideId, key, fallback = null, slideType = null) {
  if (slideId && slideSettings[slideId] && slideSettings[slideId][key] !== undefined) {
    return slideSettings[slideId][key];
  }
  if (slideType && slideSettings[`type_${slideType}`] && slideSettings[`type_${slideType}`][key] !== undefined) {
    return slideSettings[`type_${slideType}`][key];
  }
  return fallback;
}

export function setSlideSetting(slideId, key, value, slideType = null) {
  if (!slideId && !slideType) return;
  slideSettings = {
    ...slideSettings,
  };
  if (slideId) {
    slideSettings[slideId] = {
      ...slideSettings[slideId],
      [key]: value,
    };
  }
  if (slideType) {
    slideSettings[`type_${slideType}`] = {
      ...slideSettings[`type_${slideType}`],
      [key]: value,
    };
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(slideSettings));
  } catch (e) {
    console.error(e);
  }
  notify();
}
