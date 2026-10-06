import { useState, useRef, useCallback, useEffect } from "react";
import TextToolbar from "../TextToolbar/TextToolbar";
import "./QuestionEditor.css";

const MAX_CHARS = 150;

/**
 * Reusable editable slide question (contentEditable + rich-text toolbar).
 * Used by every slide type. Uncontrolled: initialized from `initialHtml`
 * once on mount, and reports its HTML back via `onInput` on every change.
 * Remount (via key) per slide to load that slide's question.
 */
export default function QuestionEditor({
  initialHtml = "",
  placeholder = "",
  onInput,
}) {
  const [selected, setSelected] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const rootRef = useRef(null);
  const questionRef = useRef(null);
  const charCountRef = useRef(0);

  // Seed the contentEditable once (it stays uncontrolled after this).
  useEffect(() => {
    if (questionRef.current) {
      questionRef.current.innerHTML = initialHtml;
      const len = questionRef.current.textContent.length;
      setWordCount(len);
      charCountRef.current = len;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deselect when clicking anywhere outside the question + toolbar.
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const syncActiveFormats = useCallback(() => {
    if (!questionRef.current) return;
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      !questionRef.current.contains(selection.anchorNode)
    ) {
      return;
    }
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
    });
  }, []);

  const handleQuestionClick = useCallback(
    (e) => {
      e.stopPropagation();
      setSelected(true);
      // Give the DOM a tick to become contentEditable before focusing
      requestAnimationFrame(() => {
        questionRef.current?.focus();
        syncActiveFormats();
      });
    },
    [syncActiveFormats],
  );

  const handleInput = useCallback(() => {
    if (!questionRef.current) return;
    const content = questionRef.current.textContent;
    setWordCount(content.length);
    charCountRef.current = content.length;

    // If the user deleted everything, the DOM can still contain leftover
    // empty formatting tags with the caret parked inside them. Hard-reset
    // so the next keystroke starts with no formatting at all.
    if (content.length === 0 && questionRef.current.innerHTML !== "") {
      questionRef.current.innerHTML = "";
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
      });
    } else {
      syncActiveFormats();
    }

    onInput?.(questionRef.current.innerHTML);
  }, [syncActiveFormats, onInput]);

  const toggleFormat = useCallback(
    (formatKey) => {
      if (!selected || !questionRef.current) return;

      const commandMap = {
        bold: "bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "strikeThrough",
      };
      const command = commandMap[formatKey];
      if (!command) return;

      questionRef.current.focus();
      document.execCommand("styleWithCSS", false, true);

      const expected = {
        ...activeFormats,
        [formatKey]: !activeFormats[formatKey],
      };

      document.execCommand(command, false, null);

      // Underline and strikethrough share the CSS `text-decoration`
      // property; the browser can silently drop one when toggling the
      // other. Re-assert any format we did NOT mean to touch.
      const readState = () => ({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikeThrough"),
      });

      const stateAfter = readState();
      for (const key of Object.keys(expected)) {
        if (key === formatKey) continue;
        if (expected[key] !== stateAfter[key]) {
          document.execCommand(commandMap[key], false, null);
        }
      }

      syncActiveFormats();
    },
    [activeFormats, selected, syncActiveFormats],
  );

  // Keep a live ref so the keydown handler always calls the freshest
  // toggleFormat without being recreated every render.
  const toggleFormatRef = useRef(toggleFormat);
  toggleFormatRef.current = toggleFormat;

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const isModifier = e.metaKey || e.ctrlKey;

    // Allow navigation, deletion, selection, and modifier-based shortcuts
    // through even when at the character limit.
    const allowedKeys = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", "Tab", "Escape",
    ];
    const isAllowed = allowedKeys.includes(e.key) || isModifier;

    // Block printable character input when at the limit.
    if (!isAllowed && charCountRef.current >= MAX_CHARS) {
      e.preventDefault();
      return;
    }

    if (!isModifier) return;

    const key = e.key.toLowerCase();
    const shortcutMap = { b: "bold", i: "italic", u: "underline" };

    let formatKey = shortcutMap[key];
    if (!formatKey && e.shiftKey && key === "s") {
      formatKey = "strikethrough";
    }

    if (formatKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleFormatRef.current(formatKey);
    }
  }, []);

  // Trim pasted text so it doesn't exceed the character limit.
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const remaining = MAX_CHARS - charCountRef.current;
    if (remaining <= 0) return;
    const trimmed = text.slice(0, remaining);
    document.execCommand("insertText", false, trimmed);
  }, []);

  return (
    <div ref={rootRef} className="question-editor">
      <div
        className={`question-section ${selected ? "selected" : ""}`}
        onClick={handleQuestionClick}
      >
        <div
          ref={questionRef}
          className="question-editable"
          contentEditable={selected}
          suppressContentEditableWarning={true}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onInput={handleInput}
          onClick={syncActiveFormats}
          onMouseUp={syncActiveFormats}
          onKeyUp={syncActiveFormats}
          data-placeholder={placeholder}
        />
      </div>

      {selected && (
        <TextToolbar
          wordCount={wordCount}
          maxChars={MAX_CHARS}
          onBold={() => toggleFormat("bold")}
          onItalic={() => toggleFormat("italic")}
          onUnderline={() => toggleFormat("underline")}
          onStrikethrough={() => toggleFormat("strikethrough")}
          boldActive={activeFormats.bold}
          italicActive={activeFormats.italic}
          underlineActive={activeFormats.underline}
          strikethroughActive={activeFormats.strikethrough}
        />
      )}
    </div>
  );
}
