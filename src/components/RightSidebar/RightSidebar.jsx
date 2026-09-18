import { useState } from 'react';
import './RightSidebar.css';
import IconButton from '../IconButton/IconButton';

export default function RightSidebar() {
  const [activeIcon, setActiveIcon] = useState(0);

  const icons = ['sparkle', 'pencil', 'chat', 'hand', 'presentation', 'slides'];
  const titles = ['AI Suggestions', 'Edit', 'Comments', 'Raise Hand', 'Present', 'Slides'];

  return (
    <aside className="right-sidebar">
      {icons.map((icon, index) => (
        <IconButton
          key={icon}
          icon={icon}
          active={index === activeIcon}
          title={titles[index]}
          onClick={() => setActiveIcon(index)}
        />
      ))}
    </aside>
  );
}
