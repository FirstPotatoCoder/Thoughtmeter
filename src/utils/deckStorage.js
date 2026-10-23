// Local-First Deck Storage Engine
// Saves all slide decks and active deck ID in the browser's localStorage.

const DECKS_KEY = 'thoughtmeter_decks';
const ACTIVE_DECK_KEY = 'thoughtmeter_active_deck_id';

// Default initial deck when user visits for the first time
function createInitialDeck() {
  const now = Date.now();
  return {
    id: `deck_${now}`,
    title: 'Sample presentation',
    createdAt: now,
    updatedAt: now,
    slides: [],
  };
}

/**
 * Load all decks from localStorage.
 * Automatically creates an initial deck if none exist.
 */
export function loadAllDecks() {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) {
      const initial = createInitialDeck();
      localStorage.setItem(DECKS_KEY, JSON.stringify([initial]));
      localStorage.setItem(ACTIVE_DECK_KEY, initial.id);
      return [initial];
    }
    const decks = JSON.parse(raw);
    if (!Array.isArray(decks) || decks.length === 0) {
      const initial = createInitialDeck();
      localStorage.setItem(DECKS_KEY, JSON.stringify([initial]));
      localStorage.setItem(ACTIVE_DECK_KEY, initial.id);
      return [initial];
    }
    return decks;
  } catch (err) {
    console.error('Failed to load decks from localStorage:', err);
    const initial = createInitialDeck();
    return [initial];
  }
}

/**
 * Get the currently active deck ID.
 */
export function getActiveDeckId() {
  try {
    const activeId = localStorage.getItem(ACTIVE_DECK_KEY);
    const decks = loadAllDecks();
    if (activeId && decks.some((d) => d.id === activeId)) {
      return activeId;
    }
    const fallbackId = decks[0]?.id || null;
    if (fallbackId) {
      localStorage.setItem(ACTIVE_DECK_KEY, fallbackId);
    }
    return fallbackId;
  } catch {
    return null;
  }
}

/**
 * Set the currently active deck ID.
 */
export function setActiveDeckId(deckId) {
  try {
    localStorage.setItem(ACTIVE_DECK_KEY, deckId);
  } catch (err) {
    console.error('Failed to set active deck ID:', err);
  }
}

/**
 * Get the currently active deck object.
 */
export function getActiveDeck() {
  const decks = loadAllDecks();
  const activeId = getActiveDeckId();
  return decks.find((d) => d.id === activeId) || decks[0] || createInitialDeck();
}

/**
 * Save or update a deck.
 */
export function saveDeck(updatedDeck) {
  try {
    const decks = loadAllDecks();
    const index = decks.findIndex((d) => d.id === updatedDeck.id);
    const stamped = {
      ...updatedDeck,
      updatedAt: Date.now(),
    };

    let nextDecks;
    if (index >= 0) {
      nextDecks = [...decks];
      nextDecks[index] = stamped;
    } else {
      nextDecks = [stamped, ...decks];
    }

    localStorage.setItem(DECKS_KEY, JSON.stringify(nextDecks));
    return stamped;
  } catch (err) {
    console.error('Failed to save deck to localStorage:', err);
    return updatedDeck;
  }
}

/**
 * Create a new empty or template deck.
 */
export function createNewDeck(title = 'Untitled presentation', initialSlides = []) {
  const now = Date.now();
  const newDeck = {
    id: `deck_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim() || 'Untitled presentation',
    createdAt: now,
    updatedAt: now,
    slides: initialSlides,
  };

  const decks = loadAllDecks();
  const nextDecks = [newDeck, ...decks];
  localStorage.setItem(DECKS_KEY, JSON.stringify(nextDecks));
  setActiveDeckId(newDeck.id);

  return newDeck;
}

/**
 * Rename an existing deck.
 */
export function renameDeck(deckId, newTitle) {
  const decks = loadAllDecks();
  const target = decks.find((d) => d.id === deckId);
  if (!target) return null;

  target.title = newTitle.trim() || 'Untitled presentation';
  target.updatedAt = Date.now();

  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  return target;
}

/**
 * Delete a deck.
 * If the deleted deck was active, switches to the next available deck.
 */
export function deleteDeck(deckId) {
  const decks = loadAllDecks();
  const nextDecks = decks.filter((d) => d.id !== deckId);

  if (nextDecks.length === 0) {
    const fresh = createInitialDeck();
    nextDecks.push(fresh);
  }

  localStorage.setItem(DECKS_KEY, JSON.stringify(nextDecks));

  const currentActiveId = getActiveDeckId();
  if (currentActiveId === deckId) {
    setActiveDeckId(nextDecks[0].id);
  }

  return nextDecks;
}

/**
 * Duplicate a deck with cloned slides and IDs.
 */
export function duplicateDeck(deckId) {
  const decks = loadAllDecks();
  const source = decks.find((d) => d.id === deckId);
  if (!source) return null;

  const now = Date.now();
  // Deep clone slides with refreshed IDs
  const clonedSlides = (source.slides || []).map((slide, idx) => ({
    ...slide,
    id: now + idx + Math.floor(Math.random() * 1000),
    options: slide.options
      ? slide.options.map((opt, oIdx) => ({
          ...opt,
          id: now + idx * 10 + oIdx + Math.floor(Math.random() * 1000),
        }))
      : undefined,
  }));

  const copy = {
    id: `deck_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${source.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
    slides: clonedSlides,
  };

  const nextDecks = [copy, ...decks];
  localStorage.setItem(DECKS_KEY, JSON.stringify(nextDecks));
  setActiveDeckId(copy.id);

  return copy;
}

/**
 * Export a deck as a downloadable JSON file.
 */
export function exportDeckAsJson(deckId) {
  const decks = loadAllDecks();
  const target = decks.find((d) => d.id === deckId);
  if (!target) return;

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    deck: target,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (target.title || 'presentation')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  a.download = `${safeName}.thoughtmeter.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a deck from parsed JSON object or string.
 */
export function importDeckFromJson(rawJson) {
  try {
    const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    const sourceDeck = data.deck || data;

    if (!sourceDeck || !Array.isArray(sourceDeck.slides)) {
      throw new Error('Invalid Thoughtmeter presentation JSON file.');
    }

    const now = Date.now();
    const importedDeck = {
      id: `deck_${now}_${Math.random().toString(36).substring(2, 7)}`,
      title: (sourceDeck.title || 'Imported presentation') + ' (Imported)',
      createdAt: now,
      updatedAt: now,
      slides: sourceDeck.slides.map((slide, idx) => ({
        ...slide,
        id: now + idx + Math.floor(Math.random() * 1000),
        options: slide.options
          ? slide.options.map((opt, oIdx) => ({
              ...opt,
              id: now + idx * 10 + oIdx + Math.floor(Math.random() * 1000),
            }))
          : undefined,
      })),
    };

    const decks = loadAllDecks();
    const nextDecks = [importedDeck, ...decks];
    localStorage.setItem(DECKS_KEY, JSON.stringify(nextDecks));
    setActiveDeckId(importedDeck.id);

    return importedDeck;
  } catch (err) {
    console.error('Failed to import presentation:', err);
    throw err;
  }
}
