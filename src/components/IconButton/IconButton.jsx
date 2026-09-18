import './IconButton.css';
import Icon from '../Icon/Icon';

export default function IconButton({ icon, size = 32, active = false, onClick, title }) {
  return (
    <button
      className={`icon-button ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
