import { createClient, type RedisClientType } from 'redis';

export interface RateLimitStore {
  get(key: string): Promise<number>;
  increment(key: string, ttlSeconds: number): Promise<number>;
  reset(key: string): Promise<void>;
  close(): Promise<void>;
  readonly mode: 'redis' | 'memory';
}

class MemoryRateLimitStore implements RateLimitStore {
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

  async get(key: string): Promise<number> {
    return this.read(key)?.value ?? 0;
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const current = this.read(key);
    const value = (current?.value ?? 0) + 1;
    this.entries.set(key, {
      value,
      expiresAt: current?.expiresAt ?? Date.now() + ttlSeconds * 1000
    });
    return value;
  }

  async reset(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async close(): Promise<void> {
    this.entries.clear();
  }
}

class RedisRateLimitStore implements RateLimitStore {
  readonly mode = 'redis' as const;
  constructor(private readonly client: RedisClientType) {}

  async get(key: string): Promise<number> {
    return Number((await this.client.get(key)) ?? '0');
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const value = await this.client.incr(key);
    if (value === 1) await this.client.expire(key, ttlSeconds);
    return value;
  }

  async reset(key: string): Promise<void> {
    await this.client.del(key);
  }

  async close(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}

export async function createRateLimitStore(redisUrl: string | null): Promise<RateLimitStore> {
  if (!redisUrl) return new MemoryRateLimitStore();

  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    return new RedisRateLimitStore(client as RedisClientType);
  } catch {
    return new MemoryRateLimitStore();
  }
}
