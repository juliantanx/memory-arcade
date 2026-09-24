import {
  FullscreenIcon,
  HelpIcon,
  PauseIcon,
  PlayIcon,
  RestartIcon,
  VolumeIcon,
} from './Icons.jsx';

export function GameToolbar({
  status,
  world,
  muted,
  fullscreen,
  onPause,
  onRestart,
  onToggleSound,
  onOpenHelp,
  onToggleFullscreen,
}) {
  return (
    <div className="game-toolbar">
      <div className="level-label">
        <span className="pixel">CHAPTER</span>
        <span>/</span>
        {world}
      </div>
      <div className="toolbar-actions">
        <button
          className="icon-button"
          aria-label={status === 'paused' ? '继续游戏' : '暂停游戏'}
          title="暂停 / 继续 (P)"
          onClick={onPause}
        >
          {status === 'paused' ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button className="icon-button" aria-label="重新开始" title="重新开始" onClick={onRestart}>
          <RestartIcon />
        </button>
        <button
          className="icon-button"
          aria-label={muted ? '开启声音' : '关闭声音'}
          title={muted ? '开启声音 (M)' : '关闭声音 (M)'}
          onClick={onToggleSound}
        >
          <VolumeIcon muted={muted} />
        </button>
        <button className="icon-button" aria-label="操作说明" title="操作说明" onClick={onOpenHelp}>
          <HelpIcon />
        </button>
        <button
          className="icon-button"
          aria-label={fullscreen ? '退出全屏' : '进入全屏'}
          title="全屏"
          onClick={onToggleFullscreen}
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
