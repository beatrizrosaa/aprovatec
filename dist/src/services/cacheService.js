"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.deleteCache = deleteCache;
exports.deleteCachePattern = deleteCachePattern;
exports.getCacheKey = getCacheKey;
const redis_1 = require("../database/redis");
const CACHE_TTL = 300; // 5 minutos em segundos
async function getCache(key) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return null;
    try {
        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (error) {
        console.error("Erro ao buscar cache:", error);
    }
    return null;
}
async function setCache(key, value, ttl = CACHE_TTL) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        await client.setEx(key, ttl, JSON.stringify(value));
    }
    catch (error) {
        console.error("Erro ao salvar cache:", error);
    }
}
async function deleteCache(key) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        await client.del(key);
    }
    catch (error) {
        console.error("Erro ao deletar cache:", error);
    }
}
async function deleteCachePattern(pattern) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            // Usa del com múltiplos argumentos usando apply ou itera sobre as keys
            for (const key of keys) {
                await client.del(key);
            }
        }
    }
    catch (error) {
        console.error("Erro ao deletar cache por padrão:", error);
    }
}
function getCacheKey(prefix, ...parts) {
    return `${prefix}:${parts.join(":")}`;
}
