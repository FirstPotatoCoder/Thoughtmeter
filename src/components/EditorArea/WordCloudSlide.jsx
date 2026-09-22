import { useEffect, useRef, useState } from "react";
import SlideCanvas from "./SlideCanvas";
import QuestionEditor from "../QuestionEditor/QuestionEditor";
import WordCloud from "../WordCloud/WordCloud";

export default function WordCloudSlide({ slide, onQuestionChange }) {
  const [bodySelected, setBodySelected] = useState(false);
  const bodyRef = useRef(null);

  // Deselect the word-cloud body when clicking outside it.
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (bodyRef.current && !bodyRef.current.contains(e.target)) {
        setBodySelected(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  return (
    <SlideCanvas>
      <QuestionEditor
        initialHtml={slide.questionHtml}
        placeholder="What word comes to mind..."
        onInput={(html) => onQuestionChange(slide.id, html)}
      />
      <div
        ref={bodyRef}
        className={`slide-body ${bodySelected ? "selected" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setBodySelected(true);
        }}
      >
        <div className="word-cloud-inner">
          <WordCloud />
        </div>
      </div>
    </SlideCanvas>
  );
}
