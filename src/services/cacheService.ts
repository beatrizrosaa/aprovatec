import { getRedisClient } from "../database/redis";

const CACHE_TTL = 300; // 5 minutos em segundos

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error("Erro ao buscar cache:", error);
  }
  return null;
}

export async function setCache<T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error("Erro ao salvar cache:", error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error("Erro ao deletar cache:", error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      // Usa del com múltiplos argumentos usando apply ou itera sobre as keys
      for (const key of keys) {
        await client.del(key);
      }
    }
  } catch (error) {
    console.error("Erro ao deletar cache por padrão:", error);
  }
}

export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(":")}`;
}

