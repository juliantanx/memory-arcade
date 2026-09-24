import { PROJECT } from '../content/story.js';

export function SiteHeader() {
  return <header className="site-header"><div className="brand"><div className="brand-mark">{PROJECT.mark}</div><div className="brand-name">{PROJECT.title}<span>{PROJECT.subtitle}</span></div></div><div className="header-note">{PROJECT.edition}</div></header>;
}
