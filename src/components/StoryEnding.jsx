import { useEffect, useState } from 'react';
import { FINALE, REWARDS } from '../content/story.js';
import { formatCurrentDate } from '../content/date.js';

function VoucherReveal({ visible }) {
  if (!visible) return null;
  const voucher = REWARDS.voucher;
  return (
    <div className="voucher-stage">
      <div className="voucher-card" aria-label={`${voucher.title}揭晓为${voucher.revealTitle}`}>
        <div className="voucher-face voucher-front">
          <span className="pixel">HIDDEN VOUCHER</span><strong>{voucher.title}</strong><small>{voucher.code}</small>
        </div>
        <div className="voucher-face voucher-back">
          <span className="pixel">A DAY TO REMEMBER</span><strong>{voucher.revealTitle}</strong>
          <p>{voucher.description}</p><small>{voucher.code}</small>
        </div>
      </div>
    </div>
  );
}

function Celebration({ snapshot, unlocked, onUnlock, onRestart }) {
  const [revealed, setRevealed] = useState(false);
  const [rewardsReady, setRewardsReady] = useState(false);
  const [giftZoomed, setGiftZoomed] = useState(false);
  const gift = REWARDS.gift;

  useEffect(() => {
    const revealTimer = window.setTimeout(() => setRevealed(true), 180);
    const readyTimer = window.setTimeout(() => setRewardsReady(true), snapshot.voucherFound ? 1550 : 220);
    return () => { window.clearTimeout(revealTimer); window.clearTimeout(readyTimer); };
  }, [snapshot.voucherFound]);

  useEffect(() => {
    if (!giftZoomed) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setGiftZoomed(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [giftZoomed]);

  return (
    <div className="ending ending-celebration" role="dialog" aria-label="故事完成画面">
      <p className="pixel joined">NEW CHAPTER · {formatCurrentDate()}</p>
      <h2>{FINALE.players}</h2>
      <p>{FINALE.acceptedText}</p>
      <VoucherReveal visible={snapshot.voucherFound && revealed} />
      {rewardsReady && snapshot.mysteryFound && !unlocked && (
        <div className="key-reveal"><span aria-hidden="true">🔑</span><h3>神秘道具变成了一把钥匙</h3><button className="story-button" onClick={onUnlock}>解锁隐藏奖励</button></div>
      )}
      {rewardsReady && unlocked && (
        <div className="gift-card unlocked-gift">
          <button className="gift-zoom-trigger" type="button" onClick={() => setGiftZoomed(true)} aria-label="放大查看隐藏奖励">
            <img className="reward-product" src={gift.image} alt={gift.imageAlt} />
            <span>点击查看</span>
          </button>
          <div>
            <p className="pixel">{gift.label}</p><h3>{gift.title}</h3><p>{gift.description}</p>
            <div className="engraving">{gift.details.map((detail) => <strong key={detail}>{detail}</strong>)}</div>
          </div>
        </div>
      )}
      {rewardsReady && !snapshot.mysteryFound && <div className="locked-reward"><span aria-hidden="true">🔒</span><p>还有一件隐藏奖励没有找到。想解锁它，需要重新探索并找到钥匙。</p></div>}
      {rewardsReady && <div className="reward-ledger"><strong>本次隐藏奖励 {snapshot.hiddenRewardsFound}/{snapshot.hiddenRewardCount}</strong><span>{snapshot.hiddenRewardsFound === snapshot.hiddenRewardCount ? '全部收集完成' : '仍有未知奖励散落在关卡中'}</span></div>}
      {snapshot.hiddenRewardsFound < snapshot.hiddenRewardCount && <button className="ending-restart" onClick={onRestart}>重新探索</button>}
      {giftZoomed && (
        <div className="product-lightbox" role="dialog" aria-modal="true" aria-label="隐藏奖励大图" onClick={() => setGiftZoomed(false)}>
          <div className="product-lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button className="lightbox-close" type="button" aria-label="关闭大图" onClick={() => setGiftZoomed(false)}>×</button>
            <img src={gift.image} alt={gift.imageAlt} />
            <p>{gift.details.map((detail) => <strong key={detail}>{detail}</strong>)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function StoryEnding({ snapshot, onCelebrate, onUnlock, onRestart }) {
  const [page, setPage] = useState(0);
  const currentDate = formatCurrentDate();
  useEffect(() => { if (snapshot.status === 'finale') setPage(0); }, [snapshot.status]);

  if (['celebrated', 'unlocked'].includes(snapshot.status)) {
    return <Celebration snapshot={snapshot} unlocked={snapshot.status === 'unlocked'} onUnlock={onUnlock} onRestart={onRestart} />;
  }
  if (snapshot.status !== 'finale') return null;
  if (page === 0) return (
    <div className="ending ending-letter" role="dialog" aria-label="故事终章">
      <img className="pixel-couple" src={FINALE.illustration} alt={FINALE.illustrationAlt} />
      <div className="letter-copy">
        <p className="pixel letter-kicker">{FINALE.kicker} · {currentDate}</p><h2>{FINALE.title}</h2>
        {FINALE.letter.map((line) => <p key={line}>{line}</p>)}
        <button className="story-button" onClick={() => setPage(1)}>最后一页 <span aria-hidden="true">→</span></button>
      </div>
    </div>
  );
  return (
    <div className="ending ending-question" role="dialog" aria-label="故事最终问题">
      <p className="pixel question-date">{formatCurrentDate(' · ')}</p><p className="question-preface">{FINALE.prompt}</p>
      <h2>{FINALE.question.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
      <div className="question-heart" aria-hidden="true">♥</div>
      <p className="look-up">{FINALE.cue}</p><button className="accepted-button" onClick={onCelebrate}>{FINALE.acceptLabel} <span aria-hidden="true">♥</span></button>
    </div>
  );
}
