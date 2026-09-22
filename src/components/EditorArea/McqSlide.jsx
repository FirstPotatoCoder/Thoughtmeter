import { useEffect, useRef, useState } from "react";
import SlideCanvas from "./SlideCanvas";
import QuestionEditor from "../QuestionEditor/QuestionEditor";
import { MCQ_COLORS } from "../../palette";
import "./McqSlide.css";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 1;

export default function McqSlide({
  slide,
  onQuestionChange,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) {
  const options = slide.options;
  // Nothing is selected by default (e.g. right after creating the slide).
  const [selectedId, setSelectedId] = useState(null);
  const [colorPickerFor, setColorPickerFor] = useState(null);
  const [labelEditingId, setLabelEditingId] = useState(null);
  const labelRefs = useRef({});
  const optionsRef = useRef(null);

  // Selected option no longer exists (e.g. was deleted) -> nothing selected.
  const selected = options.some((o) => o.id === selectedId) ? selectedId : null;

  // Clicking outside the options area deselects (and ends label editing).
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setSelectedId(null);
        setLabelEditingId(null);
        setColorPickerFor(null);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Clicking an option starts label editing immediately and selects all
  // existing text, so typing overwrites it instead of appending.
  const startLabelEdit = (optionId) => {
    setLabelEditingId(optionId);
    requestAnimationFrame(() => {
      const el = labelRefs.current[optionId];
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  };

  const handleOptionClick = (optionId) => {
    setSelectedId(optionId);
    setColorPickerFor(null);
    startLabelEdit(optionId);
  };

  const commitLabel = (optionId, element) => {
    // '' keeps the CSS placeholder ("Option") showing.
    const label = element.textContent.trim();
    element.textContent = label; // normalize (strips pasted rich-text tags)
    onUpdateOption(slide.id, optionId, { label });
    setLabelEditingId(null);
  };

  return (
    <SlideCanvas>
      <QuestionEditor
        initialHtml={slide.questionHtml}
        placeholder="Which of these..."
        onInput={(html) => onQuestionChange(slide.id, html)}
      />
      <div className="slide-body mcq-body">
        <div className="mcq-options" ref={optionsRef}>
          {options.map((option) => {
            const isSelected = option.id === selected;
            return (
              <div
                className="mcq-option"
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
              >
                <span className="mcq-bar-count">0</span>
                <div className={`mcq-option-box ${isSelected ? "selected" : ""}`}>
                  <div
                    className="mcq-bar"
                    style={{ background: option.color }}
                  />
                  <span
                    ref={(el) => (labelRefs.current[option.id] = el)}
                    className="mcq-bar-label"
                    contentEditable={labelEditingId === option.id}
                    suppressContentEditableWarning={true}
                    data-placeholder="Option"
                    onInput={(e) => {
                      // Delete-all can leave stray <br>/tags behind which
                      // would hide the :empty placeholder. Hard-reset.
                      const el = e.currentTarget;
                      if (el.textContent.length === 0 && el.innerHTML !== "") {
                        el.innerHTML = "";
                      }
                    }}
                    onBlur={(e) => commitLabel(option.id, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {option.label}
                  </span>

                  {isSelected && options.length < MAX_OPTIONS && (
                    <button
                      className="mcq-add-btn"
                      title="Add option"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOption(slide.id);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>

                {isSelected && (
                  <div
                    className="mcq-option-toolbar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="mcq-color-btn"
                      title="Change color"
                      style={{ background: option.color }}
                      onClick={() =>
                        setColorPickerFor(
                          colorPickerFor === option.id ? null : option.id
                        )
                      }
                    />
                    {colorPickerFor === option.id && (
                      <div className="mcq-color-picker">
                        {MCQ_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`mcq-color-swatch ${
                              color === option.color ? "active" : ""
                            }`}
                            style={{ background: color }}
                            title={color}
                            onClick={() => {
                              onUpdateOption(slide.id, option.id, { color });
                              setColorPickerFor(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      className="mcq-toolbar-btn"
                      title="Delete option"
                      disabled={options.length <= MIN_OPTIONS}
                      onClick={() => onDeleteOption(slide.id, option.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                    <span className="mcq-count-pill">0</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SlideCanvas>
  );
}
