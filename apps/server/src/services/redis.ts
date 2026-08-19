import { createClient, type RedisClientType } from 'redis';

export async function createRedis(url: string): Promise<RedisClientType> {
  const client = createClient({ url });
  await client.connect();
  return client as RedisClientType;
}
