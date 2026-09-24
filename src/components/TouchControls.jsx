import { ChevronIcon } from './Icons.jsx';

function TouchButton({ action, label, className = '', onInput, children }) {
  const release = (event) => {
    event.currentTarget.dataset.held = 'false';
    onInput(action, false);
  };
  return (
    <button
      className={`touch-button ${className}`}
      aria-label={label}
      data-held="false"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.dataset.held = 'true';
        event.currentTarget.setPointerCapture(event.pointerId);
        onInput(action, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {children}
    </button>
  );
}

export function TouchControls({ onInput }) {
  return (
    <div className="touch-controls">
      <div className="touch-group">
        <TouchButton action="left" label="向左" onInput={onInput}>
          <ChevronIcon direction="left" />
        </TouchButton>
        <TouchButton action="right" label="向右" onInput={onInput}>
          <ChevronIcon direction="right" />
        </TouchButton>
        <TouchButton action="down" label="向下" onInput={onInput}>↓</TouchButton>
      </div>
      <div className="touch-group">
        <TouchButton action="run" label="加速" className="touch-run" onInput={onInput}>加速</TouchButton>
        <TouchButton action="jump" label="跳跃" className="touch-jump" onInput={onInput}>跳跃</TouchButton>
      </div>
    </div>
  );
}
