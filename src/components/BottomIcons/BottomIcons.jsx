import "./BottomIcons.css";
import Icon from "../Icon/Icon";

export default function BottomIcons() {
  return (
    <div className="bottom-icons">
      <button className="icon-btn" title="QR Code">
        <Icon name="qr" />
      </button>
    </div>
  );
}
