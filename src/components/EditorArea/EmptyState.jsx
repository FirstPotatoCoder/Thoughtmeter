import "./EmptyState.css";

export default function EmptyState() {
  return (
    <div className="editor-area empty-area">
      <div className="logo-container">
        <div className="logo-mark" />
        <span className="logo-text">Mentimeter</span>
      </div>
      <div className="empty-text">
        <h2 className="empty-title">No slides yet</h2>
        <p className="empty-subtitle">
          Click <strong>+ New slide</strong> to create your first interactive question
        </p>
      </div>
      <button className="thumbs-up-btn" title="Thumbs up" />
    </div>
  );
}
