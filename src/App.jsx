import './App.css';
import TopBar from './components/TopBar/TopBar';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import EditorArea from './components/EditorArea/EditorArea';
import RightSidebar from './components/RightSidebar/RightSidebar';
import BottomIcons from './components/BottomIcons/BottomIcons';

function App() {
  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <LeftSidebar />
        <main className="main-content">
          <EditorArea />
          <BottomIcons />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
