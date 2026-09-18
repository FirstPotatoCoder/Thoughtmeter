import './LeftSidebar.css';
import SlideThumbnail from '../SlideThumbnail/SlideThumbnail';

export default function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      <button className="btn-new-slide">+ New slide</button>
      <SlideThumbnail />
    </aside>
  );
}
