import { LightbulbIcon } from './Icons.jsx';
import { PROJECT } from '../content/story.js';

export function Instructions() {
  return (
    <>
      <div className="under-game">
        <div className="controls">
          <div className="control"><div className="key-group"><kbd>←</kbd><kbd>→</kbd></div>移动</div>
          <div className="control"><kbd>SPACE</kbd>跳跃</div>
          <div className="control"><kbd>SHIFT</kbd>加速</div>
          <div className="control"><kbd>↓</kbd>尝试水管</div>
        </div>
        <div className="tip"><LightbulbIcon />顶一顶砖块，也许会有意外发现。</div>
      </div>
      <footer className="bottom-line">
        <span>{PROJECT.footer}</span>
        <span>{PROJECT.footerCode}</span>
      </footer>
    </>
  );
}
