import { useState } from 'react';
import './App.css';
import TopBar from './components/TopBar/TopBar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import EditorArea from './components/EditorArea/EditorArea';
import RightSidebar from './components/RightSidebar/RightSidebar';
import BottomIcons from './components/BottomIcons/BottomIcons';
import { MCQ_COLORS } from './palette';

const DEFAULT_MCQ_OPTIONS = () =>
  [0, 1, 2].map((i) => ({
    id: Date.now() + i,
    // '' = empty; the label renders the "Option" placeholder via CSS.
    label: '',
    color: MCQ_COLORS[i],
  }));

function App() {
  // Slide type being previewed in the canvas (e.g. 'mcq' while hovering
  // the MCQ button in the New slide menu). null = the actual slide.
  const [previewType, setPreviewType] = useState(null);
  const [slides, setSlides] = useState([
    { id: 1, type: 'wordcloud', questionHtml: '' },
  ]);
  const [activeSlideId, setActiveSlideId] = useState(1);

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];

  const addSlide = (type) => {
    const slide =
      type === 'mcq'
        ? { id: Date.now(), type, questionHtml: '', options: DEFAULT_MCQ_OPTIONS() }
        : { id: Date.now(), type, questionHtml: '' };
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

  const handleSelectOption = (id) => {
    if (id === 'mcq') addSlide('mcq');
    // Word Cloud / Open Ended / Q&A are not implemented yet.
  };

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <LeftSidebar
          onPreviewSlide={setPreviewType}
          slides={slides}
          activeSlideId={activeSlide.id}
          onSelectSlide={setActiveSlideId}
          onSelectOption={handleSelectOption}
        />
        <main className="main-content">
          <EditorArea
            key={activeSlide.id + (previewType ? `-${previewType}` : '')}
            previewType={previewType}
            slide={activeSlide}
            onQuestionChange={handleQuestionChange}
            onAddOption={handleAddOption}
            onUpdateOption={handleUpdateOption}
            onDeleteOption={handleDeleteOption}
          />
          <BottomIcons />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
