export function GameHud({ snapshot }) {
  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-col">WORLD<span>{snapshot.world}</span></div>
      <div className="hud-col">COINS<span className="hud-coin">● {String(snapshot.coins).padStart(2, '0')}</span></div>
      <div className="hud-col">FRAGMENTS<span>{snapshot.memoriesSeen} / {snapshot.memoryCount}</span></div>
      <div className="hud-col">TIME<span>{Math.ceil(snapshot.time)}</span></div>
    </div>
  );
}
