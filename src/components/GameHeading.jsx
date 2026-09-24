import { PROJECT } from '../content/story.js';

export function GameHeading() {
  return (
    <div className="game-heading">
      <div>
        <p className="eyebrow">{PROJECT.eyebrow}</p>
        <h1>《{PROJECT.title}》</h1>
      </div>
      <div className="best story-signature">
        <span>{PROJECT.sinceLabel}</span>
        <strong className="pixel">{PROJECT.since}</strong>
      </div>
    </div>
  );
}
