"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
exports.getRedisClient = getRedisClient;
exports.disconnectRedis = disconnectRedis;
const redis_1 = require("redis");
let redisClient = null;
async function connectRedis() {
    // Se já existe um cliente conectado, retornar
    if (redisClient && redisClient.isOpen) {
        return;
    }
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.warn("REDIS_URL não definido no .env - cache desabilitado");
        return;
    }
    try {
        // Se já existe um cliente mas não está conectado, tentar reconectar
        if (redisClient && !redisClient.isOpen) {
            await redisClient.connect();
            return;
        }
        // Criar novo cliente
        redisClient = (0, redis_1.createClient)({
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
    }
    catch (error) {
        console.error("Erro ao conectar no Redis:", error);
        // Não encerra a aplicação se Redis falhar, apenas desabilita o cache
        redisClient = null;
    }
}
function getRedisClient() {
    return redisClient;
}
async function disconnectRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
