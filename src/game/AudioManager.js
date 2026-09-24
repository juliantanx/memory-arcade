export class AudioManager {
  constructor() {
    this.context = null;
    this.muted = false;
    this.nextNote = 0;
    this.note = 0;
    this.nodes = new Set();
  }

  init() {
    if (!this.context) {
      try {
        this.context = new AudioContext();
      } catch {
        return;
      }
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
  }

  tone(frequency, duration, delay = 0, type = 'square', volume = 0.035) {
    if (this.muted || !this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const startAt = this.context.currentTime + delay;
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.01);
    this.nodes.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.nodes.delete(oscillator);
    };
  }

  play(event) {
    if (event === 'jump') {
      [240, 360, 520].forEach((frequency, index) => this.tone(frequency, 0.055, index * 0.03));
    } else if (event === 'coin') {
      this.tone(988, 0.07);
      this.tone(1319, 0.22, 0.06);
    } else if (event === 'stomp') {
      this.tone(150, 0.1);
      this.tone(80, 0.08, 0.035);
    } else if (event === 'bump' || event === 'break') {
      this.tone(90, 0.11, 0, 'triangle', 0.09);
    } else if (event === 'grow' || event === 'powerup' || event === 'life') {
      [262, 330, 392, 523, 659, 784].forEach((frequency, index) =>
        this.tone(frequency, 0.09, index * 0.055),
      );
    } else if (event === 'death') {
      this.stop();
      [494, 466, 440, 415, 392, 349, 294, 196].forEach((frequency, index) =>
        this.tone(frequency, 0.15, index * 0.14),
      );
    } else if (event === 'memory') {
      [392, 523, 659].forEach((frequency, index) => this.tone(frequency, 0.22, index * 0.12, 'sine', 0.035));
    } else if (event === 'gift') {
      [523, 659, 784, 988].forEach((frequency, index) =>
        this.tone(frequency, 0.24, index * 0.1, 'sine', 0.04),
      );
    } else if (event === 'win') {
      this.stop();
      [262, 330, 392, 523, 392, 523, 659, 784, 1047].forEach((frequency, index) =>
        this.tone(frequency, 0.18, index * 0.14),
      );
    } else if (event === 'celebrate') {
      [523, 659, 784, 1047, 1319].forEach((frequency, index) =>
        this.tone(frequency, 0.35, index * 0.16, 'sine', 0.045),
      );
    } else if (event === 'pipe') {
      [350, 280, 210, 140].forEach((frequency, index) =>
        this.tone(frequency, 0.08, index * 0.055),
      );
    } else if (event === 'hurt') {
      this.tone(120, 0.2, 0, 'sawtooth');
    }
  }

  playMusic(underground) {
    const context = this.context;
    if (!context || this.muted || context.state !== 'running' || context.currentTime < this.nextNote) {
      return;
    }
    const melody = underground
      ? [196, 0, 233, 0, 262, 196, 0, 147, 175, 0, 196, 0, 262, 233, 196, 0]
      : [
          523, 659, 784, 0, 659, 523, 587, 784, 880, 0, 784, 659, 523, 0, 392, 0,
          440, 523, 659, 0, 587, 494, 392, 0, 523, 659, 784, 1047, 880, 784, 659, 0,
        ];
    const frequency = melody[this.note % melody.length];
    if (frequency) this.tone(frequency, 0.12, 0, 'square', 0.012);
    if (this.note % 4 === 0) {
      const bass = [0, 1, 2, 3][Math.floor(this.note / 8) % 4] === 2 ? 1.5 : 1;
      this.tone((underground ? 98 : 131) * bass, 0.18, 0, 'triangle', 0.028);
    }
    this.note += 1;
    this.nextNote = context.currentTime + 0.16;
  }

  stop() {
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        // A scheduled oscillator may already be stopped.
      }
    }
    this.nodes.clear();
    this.nextNote = 0;
  }

  destroy() {
    this.stop();
    this.context?.close().catch(() => {});
  }
}
