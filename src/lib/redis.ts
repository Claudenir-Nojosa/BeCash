// app/lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD;
    const username = process.env.REDIS_USERNAME || 'default';

    console.log('🔗 Conectando ao Redis Cloud...', { host, port });
    
    redis = new Redis({
      host,
      port,
      password,
      username,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    redis.on('connect', () => {
      console.log('✅ Conectado ao Redis Cloud');
    });

    redis.on('error', (error) => {
      console.error('❌ Erro no Redis:', error);
    });

    redis.on('close', () => {
      console.log('🔌 Conexão Redis fechada');
    });
  }

  return redis;
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('🔌 Redis desconectado');
  }
}

// Helper functions
export async function redisGet(key: string): Promise<any> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Erro no redisGet:', error);
    return null;
  }
}

export async function redisSet(key: string, value: any, ttl?: number): Promise<void> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    const expiration = ttl || parseInt(process.env.REDIS_TTL || '1800');
    
    await client.setex(key, expiration, serialized);
  } catch (error) {
    console.error('❌ Erro no redisSet:', error);
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('❌ Erro no redisDel:', error);
  }
}

export async function redisExists(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('❌ Erro no redisExists:', error);
    return false;
  }
}