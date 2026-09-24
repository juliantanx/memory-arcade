import { useCallback, useEffect, useRef, useState } from 'react';
import { GameScreen } from './GameScreen.jsx';
import { GameToolbar } from './GameToolbar.jsx';
import { HelpDialog } from './HelpDialog.jsx';
import { StatusBar } from './StatusBar.jsx';
import { TouchControls } from './TouchControls.jsx';

export function GameCabinet({ game }) {
  const cabinetRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const changeHelp = useCallback(
    (open) => {
      setHelpOpen(open);
      game.setHelp(open);
    },
    [game.setHelp],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else cabinetRef.current?.requestFullscreen().catch(() => {});
  }, []);

  return (
    <>
      <section ref={cabinetRef} className="cabinet" aria-label="可自定义的回忆闯关游戏">
        <GameToolbar
          status={game.snapshot.status}
          world={game.snapshot.world}
          muted={game.muted}
          fullscreen={fullscreen}
          onPause={game.pause}
          onRestart={game.start}
          onToggleSound={game.toggleSound}
          onOpenHelp={() => changeHelp(true)}
          onToggleFullscreen={toggleFullscreen}
        />
        <GameScreen
          canvasRef={game.canvasRef}
          snapshot={game.snapshot}
          loaded={game.loaded}
          loadError={game.loadError}
          onStart={game.start}
          onResume={game.pause}
          onContinueMemory={game.continueMemory}
          onContinueGift={game.continueGift}
          onAssemble={game.assembleFragments}
          onRevealFinale={game.revealFinale}
          onCelebrate={game.celebrate}
          onUnlock={game.unlockGift}
        />
        <TouchControls onInput={game.input} />
        <StatusBar snapshot={game.snapshot} />
      </section>
      <HelpDialog
        open={helpOpen}
        onClose={() => changeHelp(false)}
        failureLimit={game.failureLimit}
        onFailureLimit={game.setFailureLimit}
      />
    </>
  );
}
