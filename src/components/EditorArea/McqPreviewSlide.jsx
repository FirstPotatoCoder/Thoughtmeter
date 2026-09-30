import SlideCanvas from "./SlideCanvas";
import McqPreview from "./McqPreview";

/** Static animated preview shown while hovering the MCQ button. */
export default function McqPreviewSlide() {
  return (
    <SlideCanvas>
      <div className="mcq-question-pill">
        Get answers, thoughts, or feedback with a multiple choice question
      </div>
      <div className="slide-body">
        <div className="word-cloud-inner">
          <McqPreview />
        </div>
      </div>
    </SlideCanvas>
  );
}
