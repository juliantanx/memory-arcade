import { getMemory } from '../content/story.js';

export function MemoryMoment({ memoryId, memoryNumber, memoryCount, onContinue }) {
  const memory = getMemory(memoryId);
  if (!memory) return null;
  return (
    <div className={`memory-moment memory-${memory.accent}`} role="dialog" aria-label={memory.title}>
      <figure className="memory-photo">
        <img src={memory.photo} alt={memory.alt} />
        <span className="photo-index">FRAME {String(memoryNumber).padStart(2, '0')}</span>
      </figure>
      <div className="memory-copy">
        <p className="memory-chapter pixel">{memory.chapter}</p>
        <h2>{memory.title}</h2>
        <p>{memory.body}</p>
        <div className="memory-foot">
          <span>{memory.date}</span>
          <button className="story-button" onClick={onContinue}>
            继续前进 <span aria-hidden="true">→</span>
          </button>
        </div>
        <small>{memoryNumber} / {memoryCount} · 也可按 Enter</small>
      </div>
    </div>
  );
}
