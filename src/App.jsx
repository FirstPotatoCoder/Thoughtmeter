import { useState, useEffect } from 'react';
import './App.css';
import TopBar from './components/TopBar/TopBar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import EditorArea from './components/EditorArea/EditorArea';
import RightSidebar from './components/RightSidebar/RightSidebar';
import BottomIcons from './components/BottomIcons/BottomIcons';
import PresentationPreview from './components/PresentationPreview/PresentationPreview';
import { MCQ_COLORS } from './palette';
import {
  loadAllDecks,
  getActiveDeck,
  saveDeck,
  createNewDeck,
  setActiveDeckId,
  renameDeck,
  deleteDeck,
  duplicateDeck,
  importDeckFromJson,
} from './utils/deckStorage';
import { setSlideDeck } from './utils/slideSettings';

const DEFAULT_MCQ_OPTIONS = () =>
  [0, 1, 2].map((i) => ({
    id: Date.now() + i,
    label: '',
    color: MCQ_COLORS[i],
  }));

function App() {
  // Deck state loaded from localStorage
  const [allDecks, setAllDecks] = useState(() => loadAllDecks());
  const [deck, setDeck] = useState(() => getActiveDeck());
  const slides = deck.slides || [];

  const [activeSlideId, setActiveSlideId] = useState(() => slides[0]?.id || null);
  const [previewType, setPreviewType] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sync slides to slideSettings engine
  useEffect(() => {
    setSlideDeck(slides);
  }, [slides]);

  // Ensure activeSlideId is valid when slides change
  useEffect(() => {
    if (slides.length > 0 && (!activeSlideId || !slides.some((s) => s.id === activeSlideId))) {
      setActiveSlideId(slides[0].id);
    }
  }, [slides, activeSlideId]);

  const activeSlide = slides.find((s) => s.id === activeSlideId);

  // Helper updater that auto-saves slides to localStorage
  const setSlides = (updater) => {
    setDeck((prevDeck) => {
      const currentSlides = prevDeck.slides || [];
      const nextSlides = typeof updater === 'function' ? updater(currentSlides) : updater;
      const updatedDeck = { ...prevDeck, slides: nextSlides };
      saveDeck(updatedDeck);
      setAllDecks(loadAllDecks());
      return updatedDeck;
    });
  };

  const addSlide = (type) => {
    const slide =
      type === 'mcq'
        ? {
            id: Date.now(),
            type,
            questionHtml: '',
            options: DEFAULT_MCQ_OPTIONS(),
          }
        : { id: Date.now(), type, questionHtml: '', cloudWords: [] };
    setSlides((prev) => [...prev, slide]);
    setActiveSlideId(slide.id);
  };

  const updateSlide = (id, patch) =>
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleQuestionChange = (slideId, html) =>
    updateSlide(slideId, { questionHtml: html });

  const handleAddOption = (slideId) =>
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId
          ? {
              ...s,
              options: [
                ...s.options,
                {
                  id: Date.now(),
                  label: '',
                  color: MCQ_COLORS[s.options.length % MCQ_COLORS.length],
                },
              ],
            }
          : s,
      ),
    );

  const handleUpdateOption = (slideId, optionId, patch) =>
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId
          ? {
              ...s,
              options: s.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o,
              ),
            }
          : s,
      ),
    );

  const handleDeleteOption = (slideId, optionId) =>
    setSlides((prev) =>
      prev.map((s) =>
        s.id === slideId
          ? { ...s, options: s.options.filter((o) => o.id !== optionId) }
          : s,
      ),
    );

  const handleDeleteSlide = (slideId) => {
    setSlides((prev) => {
      const remaining = prev.filter((s) => s.id !== slideId);
      if (activeSlideId === slideId) {
        setActiveSlideId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const handleSelectOption = (id) => {
    if (id === 'mcq' || id === 'word-cloud' || id === 'open-ended' || id === 'qa') {
      addSlide(id);
    }
  };

  // Deck Management Handlers
  const handleRenameDeck = (newTitle) => {
    const updated = renameDeck(deck.id, newTitle);
    if (updated) {
      setDeck(updated);
      setAllDecks(loadAllDecks());
    }
  };

  const handleSwitchDeck = (newDeckId) => {
    setActiveDeckId(newDeckId);
    const target = getActiveDeck();
    setDeck(target);
    setActiveSlideId(target.slides?.[0]?.id || null);
    setAllDecks(loadAllDecks());
  };

  const handleCreateDeck = () => {
    const created = createNewDeck();
    setDeck(created);
    setActiveSlideId(null);
    setAllDecks(loadAllDecks());
  };

  const handleDuplicateDeck = (deckId) => {
    const copy = duplicateDeck(deckId);
    if (copy) {
      setDeck(copy);
      setActiveSlideId(copy.slides?.[0]?.id || null);
      setAllDecks(loadAllDecks());
    }
  };

  const handleDeleteDeck = (deckId) => {
    deleteDeck(deckId);
    const active = getActiveDeck();
    setDeck(active);
    setActiveSlideId(active.slides?.[0]?.id || null);
    setAllDecks(loadAllDecks());
  };

  const handleImportDeck = (jsonString) => {
    const imported = importDeckFromJson(jsonString);
    setDeck(imported);
    setActiveSlideId(imported.slides?.[0]?.id || null);
    setAllDecks(loadAllDecks());
  };

  return (
    <div className="app">
      <TopBar
        deckTitle={deck.title}
        currentDeckId={deck.id}
        allDecks={allDecks}
        onRenameDeck={handleRenameDeck}
        onSwitchDeck={handleSwitchDeck}
        onCreateDeck={handleCreateDeck}
        onDuplicateDeck={handleDuplicateDeck}
        onDeleteDeck={handleDeleteDeck}
        onImportDeck={handleImportDeck}
        onPreview={() => setIsPreviewOpen(true)}
      />

      <div className="app-body">
        <LeftSidebar
          onPreviewSlide={setPreviewType}
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={setActiveSlideId}
          onSelectOption={handleSelectOption}
          onDeleteSlide={handleDeleteSlide}
        />
        <main className="main-content">
          <EditorArea
            key={activeSlideId + (previewType ? `-${previewType}` : '')}
            previewType={previewType}
            slide={activeSlide}
            slides={slides}
            onQuestionChange={handleQuestionChange}
            onAddOption={handleAddOption}
            onUpdateOption={handleUpdateOption}
            onDeleteOption={handleDeleteOption}
            onUpdateCloudWords={(slideId, words) =>
              setSlides((prev) =>
                prev.map((s) =>
                  s.id === slideId ? { ...s, cloudWords: words } : s
                )
              )
            }
          />
          <BottomIcons />
        </main>
        <RightSidebar />
      </div>

      {isPreviewOpen && (
        <PresentationPreview slide={activeSlide} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  );
}

export default App;
