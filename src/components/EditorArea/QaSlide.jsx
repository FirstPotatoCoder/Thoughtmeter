import { useEffect, useRef, useState } from "react";
import SlideCanvas from "./SlideCanvas";
import QuestionEditor from "../QuestionEditor/QuestionEditor";
import "./QaSlide.css";

export default function QaSlide({ slide, onQuestionChange }) {
  const [bodySelected, setBodySelected] = useState(false);
  const bodyRef = useRef(null);

  // Deselect the slide body when clicking outside it.
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
        placeholder="Ask me anything!"
        onInput={(html) => onQuestionChange(slide.id, html)}
      />
      <div
        ref={bodyRef}
        className={`slide-body qa-body ${bodySelected ? "selected" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setBodySelected(true);
        }}
      >
        <div className="qa-empty-container">
          <h2 className="qa-empty-heading">No questions from the audience!</h2>
          <p className="qa-empty-subtext">
            Incoming questions will show up here so that you can answer them one by one.
          </p>
        </div>
      </div>
    </SlideCanvas>
  );
}
