import SlideCanvas from "./SlideCanvas";
import QaPreview from "./QaPreview";

/** Live preview shown while hovering the Q&A button in the New Slide menu. */
export default function QaPreviewSlide() {
  return (
    <SlideCanvas>
      <div className="qa-question-pill">
        A dedicated space for participants to submit questions directly to you
      </div>
      <div className="slide-body">
        <QaPreview />
      </div>
    </SlideCanvas>
  );
}
