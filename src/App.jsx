import { GameCabinet } from './components/GameCabinet.jsx';
import { GameHeading } from './components/GameHeading.jsx';
import { Instructions } from './components/Instructions.jsx';
import { SiteHeader } from './components/SiteHeader.jsx';
import { useGameController } from './hooks/useGameController.js';

function liveMessage(snapshot) {
  if (snapshot.status === 'playing') return `探索进行中，已获得${snapshot.memoriesSeen}枚碎片`;
  if (snapshot.status === 'memory') return '发现一枚记忆碎片';
  if (snapshot.status === 'voucher') return '发现隐藏代金券';
  if (snapshot.status === 'mystery') return '发现神秘道具';
  if (snapshot.status === 'results') return '正在清点探索结果';
  return '';
}

export default function App() {
  const game = useGameController();
  return (
    <>
      <SiteHeader />
      <main>
        <GameHeading />
        <GameCabinet game={game} />
        <Instructions />
        <span className="sr-only" aria-live="polite">{liveMessage(game.snapshot)}</span>
      </main>
    </>
  );
}
