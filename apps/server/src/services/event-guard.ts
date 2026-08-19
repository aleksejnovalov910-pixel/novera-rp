export class EventGuard {
  private readonly buckets = new Map<string, { count:number; resetsAt:number }>();

  allow(player: PlayerMp, event: string, limit = 12, windowMs = 1000): boolean {
    const key = `${player.id}:${event}`;
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetsAt <= now) { this.buckets.set(key,{count:1,resetsAt:now+windowMs}); return true; }
    existing.count += 1;
    return existing.count <= limit;
  }

  clear(player: PlayerMp): void {
    const prefix = `${player.id}:`;
    for (const key of this.buckets.keys()) if (key.startsWith(prefix)) this.buckets.delete(key);
  }
}
