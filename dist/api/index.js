"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/database");
const redis_1 = require("../src/database/redis");
// Inicializar conexões antes de processar requisições
let isInitialized = false;
async function initialize() {
    if (!isInitialized) {
        try {
            await (0, database_1.connectDatabase)();
            await (0, redis_1.connectRedis)();
            isInitialized = true;
        }
        catch (error) {
            console.error("Erro ao inicializar conexões:", error);
        }
    }
}
// Inicializar conexões quando o módulo for carregado
initialize();
// Exportar o app Express para o Vercel
// O @vercel/node converterá automaticamente para uma função serverless
exports.default = app_1.default;
