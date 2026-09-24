function statusText(snapshot) {
  if (snapshot.status === 'ready') return '等待玩家进入关卡';
  if (snapshot.status === 'paused') return '旅程暂停';
  if (snapshot.status === 'memory') return '发现一枚记忆碎片';
  if (snapshot.status === 'voucher') return '发现隐藏代金券';
  if (snapshot.status === 'mystery') return '发现神秘道具';
  if (snapshot.status === 'results') return '正在清点探索结果';
  if (snapshot.status === 'dying') return '返回安全落脚点';
  return snapshot.world;
}

export function StatusBar({ snapshot }) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <i className="live-dot" />
        <strong>ATTEMPTS {snapshot.lives}</strong>
        <span>·</span>
        {statusText(snapshot)}
      </div>
      <div className="progress-label">
        <span>关卡进度 {Math.floor(snapshot.progress)}%</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${snapshot.progress}%` }} />
        </div>
      </div>
    </div>
  );
}
