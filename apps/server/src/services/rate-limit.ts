export interface RateLimitStore {
  get(key: string): Promise<number>;
  increment(key: string, ttlSeconds: number): Promise<number>;
  reset(key: string): Promise<void>;
  close(): Promise<void>;
  readonly mode: 'memory';
}

export class MemoryRateLimitStore implements RateLimitStore {
  readonly mode = 'memory' as const;
  private readonly entries = new Map<string, { value: number; expiresAt: number }>();

  private read(key: string): { value: number; expiresAt: number } | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry;
  }

  async get(key: string): Promise<number> { return this.read(key)?.value ?? 0; }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const current = this.read(key);
    const value = (current?.value ?? 0) + 1;
    this.entries.set(key, { value, expiresAt: current?.expiresAt ?? Date.now() + ttlSeconds * 1000 });
    return value;
  }

  async reset(key: string): Promise<void> { this.entries.delete(key); }
  async close(): Promise<void> { this.entries.clear(); }
}

export async function createRateLimitStore(_redisUrl: string | null): Promise<RateLimitStore> {
  return new MemoryRateLimitStore();
}
