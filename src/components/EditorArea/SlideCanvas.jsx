import "./EditorArea.css";

/**
 * Shared fixed-size slide canvas: white card + logo + thumbs-up.
 * Every slide type renders its content inside this.
 */
export default function SlideCanvas({ children }) {
  return (
    <div className="editor-area">
      <div className="logo-container">
        <div className="logo-mark" />
        <span className="logo-text">Mentimeter</span>
      </div>
      {children}
      <button className="thumbs-up-btn" title="Thumbs up" />
    </div>
  );
}
