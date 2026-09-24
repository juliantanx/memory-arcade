import { useEffect } from 'react';

export function FragmentResults({ snapshot, assembling, onAssemble, onReveal, onRestart }) {
  useEffect(() => {
    if (!assembling) return undefined;
    const timer = window.setTimeout(onReveal, 1050);
    return () => window.clearTimeout(timer);
  }, [assembling, onReveal]);

  const complete = snapshot.memoriesSeen === snapshot.memoryCount;
  return (
    <div className={`fragment-results ${assembling ? 'is-assembling' : ''}`} role="dialog" aria-label="本次探索结果">
      <p className="pixel result-kicker">LEVEL CLEAR</p>
      <h2>{complete ? `${snapshot.memoryCount}枚碎片，全部找到了` : '还有碎片散落在路上'}</h2>
      <div className="fragment-board" aria-label={`记忆碎片 ${snapshot.memoriesSeen}/${snapshot.memoryCount}`}>
        {Array.from({ length: snapshot.memoryCount }, (_, index) => (
          <i key={index} className={index < snapshot.memoriesSeen ? 'found' : ''}><span>{index < snapshot.memoriesSeen ? index + 1 : '?'}</span></i>
        ))}
      </div>
      <p>记忆碎片 {snapshot.memoriesSeen}/{snapshot.memoryCount} · 隐藏奖励 {snapshot.hiddenRewardsFound}/{snapshot.hiddenRewardCount}</p>
      {complete ? (
        <button className="story-button assemble-button" disabled={assembling} onClick={onAssemble}>
          {assembling ? '正在拼接…' : '拼接碎片'}
        </button>
      ) : (
        <button className="story-button" onClick={onRestart}>重新探索</button>
      )}
      {!complete && <small>完整重开后，碎片和奖励会重新藏到不同位置。</small>}
    </div>
  );
}
