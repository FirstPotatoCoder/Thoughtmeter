import "./EditorArea.css";
import WordCloud from "../WordCloud/WordCloud";
import TextToolbar from "../TextToolbar/TextToolbar";
import { useState, useRef, useCallback } from "react";

const MAX_CHARS = 150;

export default function EditorArea() {
  const [selectedSection, setSelectedSection] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const questionRef = useRef(null);
  const wordCloudRef = useRef(null);

  const handleQuestionClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedSection("question");
    // Give the DOM a tick to become contentEditable before focusing
    requestAnimationFrame(() => {
      questionRef.current?.focus();
      syncActiveFormats();
    });
  }, []);

  const handleWordCloudClick = useCallback((e) => {
    e.stopPropagation();
    setSelectedSection("wordcloud");
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedSection(null);
  }, []);

  // Read the browser's own idea of what's active at the caret/selection.
  // This is the single source of truth — no manual DOM walking needed.
  const syncActiveFormats = useCallback(() => {
    if (!questionRef.current) return;
    // Only trust queryCommandState while focus is actually inside the editor
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

  const handleInput = useCallback(() => {
    if (!questionRef.current) return;
    const content = questionRef.current.textContent;
    setWordCount(content.length);

    // If the user deleted everything, the DOM can still contain leftover
    // empty formatting tags (e.g. <b><u></u></b>) with the caret parked
    // inside them. That's why "new text comes in with styles instead of
    // default" after a delete-all. Hard-reset to a clean empty node so
    // the next keystroke starts with no formatting at all.
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
  }, [syncActiveFormats]);

  const toggleFormat = useCallback(
    (formatKey) => {
      // Only act while the question field is actually the active section —
      // keyboard shortcuts should be no-ops if nothing is selected/focused.
      if (selectedSection !== "question" || !questionRef.current) return;

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

      // What the full format set *should* look like after this toggle —
      // everything else stays as it was, only formatKey flips.
      const expected = {
        ...activeFormats,
        [formatKey]: !activeFormats[formatKey],
      };

      document.execCommand(command, false, null);

      // Known execCommand quirk: underline and strikeThrough both live on
      // the same CSS `text-decoration` property, and the browser doesn't
      // always merge them correctly — toggling one can silently drop the
      // other, in both directions (turning one on can turn the other off,
      // and turning one off can take the other with it). Read the real
      // state back and, for every format we did NOT mean to touch this
      // click, re-assert it if the browser changed it on us.
      const readState = () => ({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikeThrough"),
      });

      const stateAfter = readState();
      for (const key of Object.keys(expected)) {
        if (key === formatKey) continue; // this one changed on purpose
        if (expected[key] !== stateAfter[key]) {
          document.execCommand(commandMap[key], false, null);
        }
      }

      syncActiveFormats();
    },
    [activeFormats, selectedSection, syncActiveFormats],
  );

  // Keep a live ref to toggleFormat so the keydown handler always calls
  // the freshest version without needing to be recreated every render
  // (toggleFormat's identity changes whenever activeFormats changes).
  const toggleFormatRef = useRef(toggleFormat);
  toggleFormatRef.current = toggleFormat;

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const isModifier = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Win/Linux
    if (!isModifier) return;

    const key = e.key.toLowerCase();
    const shortcutMap = {
      b: "bold",
      i: "italic",
      u: "underline",
    };

    // Strikethrough has no universal native shortcut; Cmd/Ctrl+Shift+S
    // is the common convention used by Google Docs, Slack, etc.
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

  return (
    <div className="editor-area" onClick={handleBackgroundClick}>
      <div className="logo-container">
        <div className="logo-mark" />
        <span className="logo-text">Mentimeter</span>
      </div>

      <div
        className={`question-section ${
          selectedSection === "question" ? "selected" : ""
        }`}
        onClick={handleQuestionClick}
      >
        <div
          ref={questionRef}
          className="question-editable"
          contentEditable={selectedSection === "question"}
          suppressContentEditableWarning={true}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onClick={syncActiveFormats}
          onMouseUp={syncActiveFormats}
          onKeyUp={syncActiveFormats}
          data-placeholder="What word comes to mind..."
        />
      </div>

      {selectedSection === "question" && (
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

      <div
        ref={wordCloudRef}
        className={`word-cloud-container ${
          selectedSection === "wordcloud" ? "selected" : ""
        }`}
        onClick={handleWordCloudClick}
      >
        <div className="word-cloud-inner">
          <WordCloud />
        </div>
      </div>

      <button className="thumbs-up-btn" title="Thumbs up" />
    </div>
  );
}
