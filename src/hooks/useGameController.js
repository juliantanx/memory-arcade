import { useCallback, useEffect, useRef, useState } from 'react';
import { GameController } from '../game/GameController.js';
import { INITIAL_SNAPSHOT } from '../game/constants.js';

const INITIAL_UI_STATE = {
  snapshot: INITIAL_SNAPSHOT,
  muted: false,
  failureLimit: 3,
  loaded: false,
  loadError: '',
};

export function useGameController() {
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const [state, setState] = useState(INITIAL_UI_STATE);

  useEffect(() => {
    const controller = new GameController(canvasRef.current, (nextState) => {
      setState((current) => ({ ...current, ...nextState }));
    });
    controllerRef.current = controller;
    controller.init().catch((error) => {
      setState((current) => ({
        ...current,
        loadError: error instanceof Error ? error.message : '游戏素材加载失败',
      }));
    });
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  const start = useCallback(() => controllerRef.current?.start(), []);
  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const toggleSound = useCallback(() => controllerRef.current?.toggleSound(), []);
  const setHelp = useCallback((open) => controllerRef.current?.setHelp(open), []);
  const input = useCallback((action, held) => controllerRef.current?.input(action, held), []);
  const continueMemory = useCallback(() => controllerRef.current?.continueMemory(), []);
  const continueGift = useCallback(() => controllerRef.current?.continueGift(), []);
  const celebrate = useCallback(() => controllerRef.current?.celebrate(), []);
  const assembleFragments = useCallback(() => controllerRef.current?.assembleFragments(), []);
  const revealFinale = useCallback(() => controllerRef.current?.revealFinale(), []);
  const unlockGift = useCallback(() => controllerRef.current?.unlockGift(), []);
  const setFailureLimit = useCallback((value) => controllerRef.current?.setFailureLimit(value), []);

  return {
    ...state,
    canvasRef,
    start,
    pause,
    toggleSound,
    setHelp,
    input,
    continueMemory,
    continueGift,
    celebrate,
    assembleFragments,
    revealFinale,
    unlockGift,
    setFailureLimit,
  };
}
