import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons.jsx';

export function HelpDialog({ open, onClose, failureLimit, onFailureLimit }) {
  const dialogRef = useRef(null);
  const [limitDraft, setLimitDraft] = useState(String(failureLimit || 3));
  useEffect(() => { const dialog = dialogRef.current; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close(); }, [open]);
  useEffect(() => { if (open) setLimitDraft(String(failureLimit || 3)); }, [open, failureLimit]);

  const saveFailureLimit = () => {
    const parsed = Number.parseInt(limitDraft, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, Math.min(99, parsed)) : failureLimit || 3;
    setLimitDraft(String(next));
    onFailureLimit(next);
  };
  return (
    <dialog ref={dialogRef} className="help-dialog" aria-labelledby="help-title" onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="help-content"><button className="dialog-close" aria-label="关闭操作说明" onClick={onClose}><CloseIcon /></button>
        <h2 id="help-title">旅行操作卡</h2><p>一路向右抵达终点。顶砖、吃蘑菇、避开怪物和深坑，也别漏掉藏在沿途的东西。</p>
        <div className="help-row"><span>左右移动</span><span>← → / A D</span></div><div className="help-row"><span>跳跃 · 长按跳得更高</span><span>空格 / W / ↑</span></div>
        <div className="help-row"><span>加速奔跑</span><span>Shift / X</span></div><div className="help-row"><span>尝试进入水管</span><span>↓ / S</span></div><div className="help-row"><span>暂停 / 静音</span><span>P / M</span></div>
        <p>六根水管中只有一根可以进入。每次完整重开，碎片、奖励和入口都会换位置；手机端使用屏幕按键。</p>
        <details className="assist-settings"><summary>游戏容错</summary><label>本局可失败次数 <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          name="game-retry-limit"
          aria-label="本局可失败次数"
          data-1p-ignore="true"
          data-lpignore="true"
          value={limitDraft}
          onChange={(event) => setLimitDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={saveFailureLimit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              saveFailureLimit();
              event.currentTarget.blur();
            }
          }}
        /></label><small>范围 1–99，默认 3 次；可全部删除后重新输入，下次完整重开生效。</small></details>
      </div>
    </dialog>
  );
}
