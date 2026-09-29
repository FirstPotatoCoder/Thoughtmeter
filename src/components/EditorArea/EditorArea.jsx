import "./EditorArea.css";
import WordCloudSlide from "./WordCloudSlide";
import McqSlide from "./McqSlide";
import McqPreviewSlide from "./McqPreviewSlide";
import WordCloudPreviewSlide from "./WordCloudPreviewSlide";

/**
 * Renders the active slide in the fixed-size canvas.
 * `previewType` (e.g. 'mcq' while hovering the New slide menu) takes
 * priority over the real slide.
 */
export default function EditorArea({
  previewType = null,
  slide,
  onQuestionChange,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) {
  if (previewType === "mcq") {
    return <McqPreviewSlide />;
  }

  if (previewType === "word-cloud") {
    return <WordCloudPreviewSlide />;
  }

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

  return <WordCloudSlide slide={slide} onQuestionChange={onQuestionChange} />;
}
