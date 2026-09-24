export function GiftDiscovery({ kind, onContinue }) {
  const voucher = kind === 'voucher';
  return (
    <div className="gift-discovery mystery-discovery" role="dialog" aria-label={voucher ? '发现隐藏代金券' : '发现神秘道具'}>
      <div className="gift-burst" aria-hidden="true">
        <i>♥</i><i>♥</i><i>♥</i><i>♥</i>
      </div>
      <div className="mystery-symbol" aria-hidden="true">{voucher ? '券' : '?'}</div>
      <div className="discovery-copy">
        <p className="pixel">HIDDEN ITEM FOUND</p>
        <h2>{voucher ? '发现一张隐藏代金券' : '发现一件神秘道具'}</h2>
        <p>{voucher ? '它的用途暂时保密，先把这张券带到终点。' : '现在还看不出它能打开什么，先把它收好。'}</p>
        <button className="story-button" onClick={onContinue}>收进背包</button>
        <small>也可按 Enter 继续</small>
      </div>
    </div>
  );
}
