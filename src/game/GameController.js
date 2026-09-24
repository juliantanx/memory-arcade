import { AudioManager } from './AudioManager.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { DEFAULT_FAILURE_LIMIT, FIXED_STEP, createInputState } from './constants.js';
import { GameWorld } from './GameWorld.js';

const KEY_TO_ACTION = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyX: 'run',
  ArrowDown: 'down',
  KeyS: 'down',
};

function readNumber(key) {
  try {
    return Number(localStorage.getItem(key) || 0) || 0;
  } catch {
    return 0;
  }
}

function readBoolean(key) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage can be disabled without preventing the game from running.
  }
}

export class GameController {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.onChange = onChange;
    this.failureLimit = readNumber('memory-arcade-failure-limit') || DEFAULT_FAILURE_LIMIT;
    this.world = new GameWorld({ failureLimit: this.failureLimit });
    this.renderer = new CanvasRenderer(canvas);
    this.audio = new AudioManager();
    this.keys = createInputState();
    this.muted = readBoolean('memory-arcade-muted');
    this.audio.muted = this.muted;
    this.loaded = false;
    this.destroyed = false;
    this.raf = 0;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.lastNotify = 0;
    this.helpOpen = false;
    this.helpWasPlaying = false;
    this.heldKeys = new Set();
    this.touchHeld = new Set();
    this.webAbort = new AbortController();

    this.onResize = () => {
      this.world.viewWidth = this.canvas.getBoundingClientRect().width < 600 ? 384 : 512;
    };
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onKeyUp = (event) => {
      this.heldKeys.delete(event.code);
      this.syncInput();
    };
    this.onBlur = () => {
      this.clearInput();
      if (this.world.status === 'playing') {
        this.world.status = 'paused';
        this.audio.stop();
        this.notify();
      }
    };
    this.onVisibilityChange = () => {
      if (document.hidden) this.onBlur();
    };
    this.loop = (time) => this.frame(time);

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(canvas);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  async init() {
    await this.renderer.load();
    if (this.destroyed) return;
    this.loaded = true;
    this.onResize();
    this.frame(0);
    this.notify();
    this.registerModelContextTools();
  }

  frame(time) {
    if (this.destroyed) return;
    const delta = this.lastFrame ? Math.min(0.1, (time - this.lastFrame) / 1000) : 0;
    this.lastFrame = time;
    this.accumulator += delta;
    const previousStatus = this.world.status;
    while (this.accumulator >= FIXED_STEP) {
      this.world.step(FIXED_STEP, this.keys);
      this.accumulator -= FIXED_STEP;
    }
    if (this.world.status === 'playing') this.audio.playMusic(this.world.underground);
    for (const event of this.world.consumeEvents()) this.audio.play(event);
    this.renderer.draw(this.world);
    if (time - this.lastNotify > 100 || previousStatus !== this.world.status) {
      this.notify();
      this.lastNotify = time;
    }
    this.raf = requestAnimationFrame(this.loop);
  }

  notify() {
    this.onChange({
      snapshot: this.world.snapshot(),
      muted: this.muted,
      loaded: this.loaded,
      failureLimit: this.failureLimit,
    });
  }

  start() {
    if (!this.loaded || this.helpOpen) return;
    this.audio.init();
    this.audio.stop();
    const viewWidth = this.world.viewWidth;
    this.world = new GameWorld({ failureLimit: this.failureLimit });
    this.world.viewWidth = viewWidth;
    this.world.start();
    this.clearInput();
    this.notify();
  }

  pause() {
    if (this.helpOpen) return;
    if (this.world.status === 'playing') {
      this.world.status = 'paused';
      this.audio.stop();
      this.clearInput();
    } else if (this.world.status === 'paused') {
      this.world.status = 'playing';
      this.audio.init();
    }
    this.notify();
  }

  continueMemory() {
    this.world.continueReveal();
    this.audio.init();
    this.clearInput();
    this.notify();
  }

  continueGift() {
    this.world.continueReveal();
    this.audio.init();
    this.clearInput();
    this.notify();
  }

  celebrate() {
    this.world.celebrate();
    for (const event of this.world.consumeEvents()) this.audio.play(event);
    this.notify();
  }

  assembleFragments() { this.world.assembleFragments(); this.notify(); }
  revealFinale() { this.world.revealFinale(); this.notify(); }
  unlockGift() { this.world.unlockGift(); this.notify(); }

  setFailureLimit(value) {
    const requestedLimit = Number(value);
    this.failureLimit = Math.max(1, Math.min(99, Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_FAILURE_LIMIT));
    writeStorage('memory-arcade-failure-limit', this.failureLimit);
    if (this.world.status === 'ready') this.world = new GameWorld({ failureLimit: this.failureLimit });
    this.notify();
  }

  toggleSound() {
    this.muted = !this.muted;
    this.audio.muted = this.muted;
    writeStorage('memory-arcade-muted', this.muted);
    if (this.muted) this.audio.stop();
    else this.audio.init();
    this.notify();
    return this.muted;
  }

  setHelp(open) {
    this.helpOpen = open;
    if (open) {
      this.helpWasPlaying = this.world.status === 'playing';
      if (this.helpWasPlaying) {
        this.world.status = 'paused';
        this.audio.stop();
        this.clearInput();
        this.notify();
      }
    } else if (this.helpWasPlaying) {
      this.world.status = 'playing';
      this.notify();
    }
    this.helpWasPlaying = open && this.helpWasPlaying;
  }

  input(action, held) {
    if (!(action in this.keys)) return;
    if (held) this.touchHeld.add(action);
    else this.touchHeld.delete(action);
    this.syncInput();
    if (held) this.audio.init();
  }

  syncInput() {
    const input = createInputState();
    for (const code of this.heldKeys) {
      const action = KEY_TO_ACTION[code];
      if (action) input[action] = true;
    }
    for (const action of this.touchHeld) input[action] = true;
    this.keys = input;
  }

  clearInput() {
    this.heldKeys.clear();
    this.touchHeld.clear();
    this.keys = createInputState();
  }

  handleKeyDown(event) {
    if (this.helpOpen || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if ((target instanceof Element && target.closest('input,textarea,select,[contenteditable="true"]')) || event.code === 'Tab') {
      return;
    }
    if (KEY_TO_ACTION[event.code]) {
      if (event.code === 'Space' && target instanceof Element && target.closest('button') && this.world.status !== 'playing') {
        return;
      }
      event.preventDefault();
      this.heldKeys.add(event.code);
      this.syncInput();
    }
    if (event.repeat) return;
    if (
      event.code === 'Enter' &&
      ['ready', 'gameover', 'results', 'celebrated', 'unlocked'].includes(this.world.status) &&
      !(target instanceof Element && target.closest('button'))
    ) {
      event.preventDefault();
      this.start();
    } else if (event.code === 'Enter' && ['memory', 'voucher', 'mystery'].includes(this.world.status)) {
      event.preventDefault();
      this.continueMemory();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault();
      this.pause();
    } else if (event.code === 'KeyM') {
      this.toggleSound();
    }
  }

  registerModelContextTools() {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;
    const tools = [
      {
        name: 'read_game_status',
        title: 'Read game status',
        description: 'Read the current level, collected fragments, progress, and game status.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: (input) => {
          if (!input || typeof input !== 'object' || Object.keys(input).length) {
            throw new Error('Expected an empty object');
          }
          return this.world.snapshot();
        },
      },
      {
        name: 'set_game_paused',
        title: 'Pause or resume the game',
        description: 'Pause or resume the active game, using the same action as the pause button.',
        inputSchema: {
          type: 'object',
          properties: { paused: { type: 'boolean' } },
          required: ['paused'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const valid =
            input &&
            typeof input === 'object' &&
            Object.keys(input).every((key) => key === 'paused') &&
            typeof input.paused === 'boolean';
          if (!valid) throw new Error('paused must be a boolean');
          if (this.helpOpen || !['playing', 'paused'].includes(this.world.status)) {
            throw new Error('No active game available to pause or resume');
          }
          if ((this.world.status === 'paused') !== input.paused) this.pause();
          return this.world.snapshot();
        },
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          modelContext.registerTool(tool, { signal: this.webAbort.signal }),
        ).catch(() => {});
      } catch {
        // Optional browser integration must not affect gameplay.
      }
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.audio.destroy();
    this.webAbort.abort();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
