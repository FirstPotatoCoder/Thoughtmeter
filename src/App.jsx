import { useState } from 'react';
import './App.css';
import TopBar from './components/TopBar/TopBar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import EditorArea from './components/EditorArea/EditorArea';
import RightSidebar from './components/RightSidebar/RightSidebar';
import BottomIcons from './components/BottomIcons/BottomIcons';
import { MCQ_COLORS } from './palette';
import { DEFAULT_CLOUD_WORDS } from './components/EditorArea/WordCloudSlide';

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
  const [slides, setSlides] = useState([]);
  const [activeSlideId, setActiveSlideId] = useState(null);

  const activeSlide = slides.find((s) => s.id === activeSlideId);

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
    if (id === 'mcq' || id === 'word-cloud' || id === 'open-ended') addSlide(id);
  };

  return (
    <div className="app">
      <TopBar />
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
    </div>
  );
}

export default App;
