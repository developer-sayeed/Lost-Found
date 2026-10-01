/**
 * Audio Alert Utility for Warwick Lost & Found Management
 * Uses Web Audio API for lightweight, zero-dependency, subtle acoustic feedback.
 */

class SoundAlertManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Check local storage for audio preferences
    try {
      const stored = localStorage.getItem('warwick_audio_alerts_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch {
      this.isEnabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext initialization ignored:', e);
      return null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('warwick_audio_alerts_enabled', String(enabled));
    } catch {}
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Subtle, elegant 3-tone ascending crystal chime for new item additions
   * Frequencies: D5 (587Hz) -> F#5 (740Hz) -> A5 (880Hz)
   */
  public playNewItemAlert() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, time: 0.0, duration: 0.18, gain: 0.12 },
        { freq: 739.99, time: 0.10, duration: 0.22, gain: 0.14 },
        { freq: 880.00, time: 0.20, duration: 0.45, gain: 0.16 }
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Soft attack and smooth exponential decay
        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });
    } catch (err) {
      console.debug('Audio alert skipped:', err);
    }
  }

  /**
   * Distinct, positive confirmation chime when an item is marked 'Dispatched'
   * Frequencies: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz)
   */
  public playDispatchAlert() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: 0.0, duration: 0.16, gain: 0.12 },
        { freq: 830.61, time: 0.09, duration: 0.18, gain: 0.13 },
        { freq: 987.77, time: 0.18, duration: 0.24, gain: 0.15 },
        { freq: 1318.51, time: 0.28, duration: 0.50, gain: 0.18 }
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Use sine with gentle harmonic warm overtone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.018);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });
    } catch (err) {
      console.debug('Audio alert skipped:', err);
    }
  }

  /**
   * Soft handover confirmation tone
   */
  public playHandoverAlert() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.2, gain: 0.12 },
        { freq: 659.25, time: 0.12, duration: 0.35, gain: 0.15 }
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });
    } catch (err) {
      console.debug('Audio alert skipped:', err);
    }
  }

  /**
   * Real-time notification chime for incoming staff & supervisor notices / broadcasts
   * Frequencies: G5 (784Hz) -> C6 (1046.5Hz)
   */
  public playNotificationChime() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 783.99, time: 0.0, duration: 0.14, gain: 0.13 },
        { freq: 1046.50, time: 0.10, duration: 0.35, gain: 0.15 }
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration + 0.05);
      });
    } catch (err) {
      console.debug('Notification chime skipped:', err);
    }
  }
}

export const soundAlert = new SoundAlertManager();
