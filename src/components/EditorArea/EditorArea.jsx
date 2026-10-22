import "./EditorArea.css";
import WordCloudSlide from "./WordCloudSlide";
import McqSlide from "./McqSlide";
import McqPreviewSlide from "./McqPreviewSlide";
import WordCloudPreviewSlide from "./WordCloudPreviewSlide";
import OpenEndedPreviewSlide from "./OpenEndedPreviewSlide";
import OpenEndedSlide from "./OpenEndedSlide";
import QaPreviewSlide from "./QaPreviewSlide";
import QaSlide from "./QaSlide";
import EmptyState from "./EmptyState";
import SlideScaler from "./SlideScaler";

/**
 * Renders the active slide in the fixed-size canvas.
 * `previewType` (e.g. 'mcq' while hovering the New slide menu) takes
 * priority over the real slide.
 *
 * Every slide is wrapped in <SlideScaler> which uses a ResizeObserver to
 * scale the fixed-size canvas to fit the available viewport.
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
    if (previewType === "mcq") return <SlideScaler><McqPreviewSlide /></SlideScaler>;
    if (previewType === "word-cloud") return <SlideScaler><WordCloudPreviewSlide /></SlideScaler>;
    if (previewType === "open-ended") return <SlideScaler><OpenEndedPreviewSlide /></SlideScaler>;
    if (previewType === "qa") return <SlideScaler><QaPreviewSlide /></SlideScaler>;
  }

  if (isEmpty) return <SlideScaler><EmptyState /></SlideScaler>;

  if (slide.type === "mcq") {
    return (
      <SlideScaler>
        <McqSlide
          slide={slide}
          onQuestionChange={onQuestionChange}
          onAddOption={onAddOption}
          onUpdateOption={onUpdateOption}
          onDeleteOption={onDeleteOption}
        />
      </SlideScaler>
    );
  }

  if (slide.type === "open-ended") {
    return (
      <SlideScaler>
        <OpenEndedSlide slide={slide} onQuestionChange={onQuestionChange} />
      </SlideScaler>
    );
  }

  if (slide.type === "qa") {
    return (
      <SlideScaler>
        <QaSlide slide={slide} onQuestionChange={onQuestionChange} />
      </SlideScaler>
    );
  }

  return (
    <SlideScaler>
      <WordCloudSlide
        slide={slide}
        onQuestionChange={onQuestionChange}
        onUpdateCloudWords={onUpdateCloudWords}
      />
    </SlideScaler>
  );
}
