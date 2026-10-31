import { PING_INTERVAL_MS } from './socketOptions';

/** Davriy `ping` taymeri: start() oldingisini to'xtatib qayta boshlaydi. */
export class PingTimer {
  private id: ReturnType<typeof setInterval> | null = null;

  start(tick: () => void): void {
    this.stop();
    this.id = setInterval(tick, PING_INTERVAL_MS);
  }

  stop(): void {
    if (this.id) {
      clearInterval(this.id);
      this.id = null;
    }
  }
}
