import { PlayIcon } from './Icons.jsx';
import { MemoryMoment } from './MemoryMoment.jsx';
import { StoryEnding } from './StoryEnding.jsx';
import { GiftDiscovery } from './GiftDiscovery.jsx';
import { FragmentResults } from './FragmentResults.jsx';
import { PROJECT } from '../content/story.js';

function ActionButton({ icon, children, ...props }) { return <button className="start-button" {...props}>{icon}{children}</button>; }

export function GameOverlay({ snapshot, loaded, loadError, onStart, onResume, onContinueMemory,
  onContinueGift, onAssemble, onRevealFinale, onCelebrate, onUnlock }) {
  if (snapshot.status === 'ready') return (
    <div className="overlay intro-overlay">
      <p className="intro-years pixel"><span>{PROJECT.introLeft}</span><i />{PROJECT.introMiddle}<i /><span>{PROJECT.introRight}</span></p>
      <div className="title-logo">{PROJECT.title}<small>{PROJECT.stageLabel}</small></div>
      <ActionButton icon={<PlayIcon size={16} />} disabled={!loaded || Boolean(loadError)} onClick={onStart}>
        {loadError ? '加载出错' : loaded ? '开始探索' : '正在准备…'}
      </ActionButton>
      <p className="start-hint">{loadError || '按 Enter 开始 · 找齐六枚记忆碎片'}</p>
    </div>
  );
  if (snapshot.status === 'paused') return <div className="overlay state-overlay"><p className="pixel">PAUSED</p><h2>旅程暂停</h2><p>休息一下，回来再继续。</p><ActionButton icon={<PlayIcon size={16} />} onClick={onResume}>继续探索</ActionButton></div>;
  if (snapshot.status === 'memory') return <MemoryMoment memoryId={snapshot.activeMemory} memoryNumber={snapshot.memoriesSeen} memoryCount={snapshot.memoryCount} onContinue={onContinueMemory} />;
  if (snapshot.status === 'voucher') return <GiftDiscovery kind="voucher" onContinue={onContinueGift} />;
  if (snapshot.status === 'mystery') return <GiftDiscovery kind="mystery" onContinue={onContinueGift} />;
  if (snapshot.status === 'results' || snapshot.status === 'assembling') return <FragmentResults snapshot={snapshot} assembling={snapshot.status === 'assembling'} onAssemble={onAssemble} onReveal={onRevealFinale} onRestart={onStart} />;
  if (['finale', 'celebrated', 'unlocked'].includes(snapshot.status)) return <StoryEnding snapshot={snapshot} onCelebrate={onCelebrate} onUnlock={onUnlock} onRestart={onStart} />;
  if (snapshot.status === 'dying') return <div className="soft-retry" role="status"><span className="pixel">TRY AGAIN</span><small>返回最近的安全落脚点 · 剩余 {snapshot.lives} 次</small></div>;
  if (snapshot.status === 'gameover') return <div className="overlay state-overlay"><p className="pixel">GAME OVER</p><h2>这次先到这里</h2><p>本局进度会清零，所有藏品也会换到新位置。</p><ActionButton icon={<PlayIcon size={16} />} onClick={onStart}>从头再来</ActionButton></div>;
  return null;
}
