import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL não definido no .env - cache desabilitado");
    return;
  }

  try {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on("error", (err) => {
      console.error("Erro no Redis:", err);
    });

    redisClient.on("connect", () => {
      console.log("Conectando ao Redis...");
    });

    redisClient.on("ready", () => {
      console.log("Redis conectado com sucesso");
    });

    await redisClient.connect();
  } catch (error) {
    console.error("Erro ao conectar no Redis:", error);
    // Não encerra a aplicação se Redis falhar, apenas desabilita o cache
    redisClient = null;
  }
}

export function getRedisClient(): ReturnType<typeof createClient> | null {
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

