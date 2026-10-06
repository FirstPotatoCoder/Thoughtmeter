import "./EditorArea.css";
import WordCloudSlide from "./WordCloudSlide";
import McqSlide from "./McqSlide";
import McqPreviewSlide from "./McqPreviewSlide";
import WordCloudPreviewSlide from "./WordCloudPreviewSlide";
import OpenEndedPreviewSlide from "./OpenEndedPreviewSlide";
import OpenEndedSlide from "./OpenEndedSlide";
import EmptyState from "./EmptyState";

/**
 * Renders the active slide in the fixed-size canvas.
 * `previewType` (e.g. 'mcq' while hovering the New slide menu) takes
 * priority over the real slide.
 */
export default function EditorArea({
  previewType = null,
  slide,
  slides = [],
  onQuestionChange,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onUpdateCloudWords,
}) {
  const isEmpty = !slide || slides.length === 0;

  if (previewType) {
    if (previewType === "mcq") return <McqPreviewSlide />;
    if (previewType === "word-cloud") return <WordCloudPreviewSlide />;
    if (previewType === "open-ended") return <OpenEndedPreviewSlide />;
  }

  if (isEmpty) return <EmptyState />;

  if (slide.type === "mcq") {
    return (
      <McqSlide
        slide={slide}
        onQuestionChange={onQuestionChange}
        onAddOption={onAddOption}
        onUpdateOption={onUpdateOption}
        onDeleteOption={onDeleteOption}
      />
    );
  }

  if (slide.type === "open-ended") {
    return <OpenEndedSlide slide={slide} onQuestionChange={onQuestionChange} />;
  }

  return (
    <WordCloudSlide
      slide={slide}
      onQuestionChange={onQuestionChange}
      onUpdateCloudWords={onUpdateCloudWords}
    />
  );
}
