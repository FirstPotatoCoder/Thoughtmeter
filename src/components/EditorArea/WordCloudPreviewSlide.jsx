import SlideCanvas from "./SlideCanvas";
import WordCloudPreview from "./WordCloudPreview";

/** Live animated preview shown while hovering the Word Cloud button. */
export default function WordCloudPreviewSlide() {
  return (
    <SlideCanvas>
      <div className="wc-question-pill">
        Participants&rsquo; responses appear automatically in a word cloud
      </div>
      <div className="slide-body">
        <div className="word-cloud-inner">
          <WordCloudPreview />
        </div>
      </div>
    </SlideCanvas>
  );
}
