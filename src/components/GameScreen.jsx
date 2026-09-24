import { GameHud } from './GameHud.jsx';
import { GameOverlay } from './GameOverlay.jsx';

export function GameScreen({ canvasRef, snapshot, loaded, loadError, onStart, onResume, onContinueMemory, onContinueGift, onAssemble, onRevealFinale, onCelebrate, onUnlock }) {
  return (
    <div className="screen">
      <canvas
        ref={canvasRef}
        width="1024"
        height="480"
        className="game-canvas"
        tabIndex="0"
        aria-label="回忆冒险游戏，按 Enter 开始，方向键移动，空格跳跃"
      />
      <GameHud snapshot={snapshot} />
      <GameOverlay
        snapshot={snapshot}
        loaded={loaded}
        loadError={loadError}
        onStart={onStart}
        onResume={onResume}
        onContinueMemory={onContinueMemory}
        onContinueGift={onContinueGift}
        onAssemble={onAssemble}
        onRevealFinale={onRevealFinale}
        onCelebrate={onCelebrate}
        onUnlock={onUnlock}
      />
    </div>
  );
}
