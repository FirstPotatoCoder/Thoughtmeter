import { useEffect, useRef, useState } from "react";
import SlideCanvas from "./SlideCanvas";
import QuestionEditor from "../QuestionEditor/QuestionEditor";
import "./OpenEndedSlide.css";

const MOCK_RESPONSES = [
  "Responses can appear up to 200 characters and will appear here.",
  "You can group responses if you get more than 10.",
  "Turn on voting so people can flag their favorite responses.",
];

export default function OpenEndedSlide({ slide, onQuestionChange }) {
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
        placeholder="Ask a question..."
        onInput={(html) => onQuestionChange(slide.id, html)}
      />
      <div
        ref={bodyRef}
        className={`slide-body oe-body ${bodySelected ? "selected" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setBodySelected(true);
        }}
      >
        <div className="oe-columns">
          {MOCK_RESPONSES.map((text, i) => (
            <div key={i} className="oe-editor-response">
              {text}
            </div>
          ))}
        </div>
      </div>
    </SlideCanvas>
  );
}
