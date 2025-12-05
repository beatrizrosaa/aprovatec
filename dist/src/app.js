"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const redis_1 = require("./database/redis");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const gradeRoutes_1 = __importDefault(require("./routes/gradeRoutes"));
const app = (0, express_1.default)();
// Configuração do CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de origens permitidas
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
            // Permitir requisições do mesmo domínio (para desenvolvimento local)
            /^https:\/\/.*\.vercel\.app$/,
            // Permitir localhost em desenvolvimento
            /^http:\/\/localhost:\d+$/,
        ].filter(Boolean);
        // Se não há origin (ex: requisições do Postman, curl, etc), permitir
        if (!origin) {
            return callback(null, true);
        }
        // Verificar se a origin está na lista de permitidas
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === "string") {
                return origin === allowedOrigin;
            }
            return allowedOrigin.test(origin);
        });
        if (isAllowed) {
            callback(null, true);
        }
        else {
            // Em desenvolvimento, permitir todas as origens
            if (process.env.NODE_ENV !== "production") {
                callback(null, true);
            }
            else {
                callback(new Error("Não permitido pelo CORS"));
            }
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ message: "API AprovaTec funcionando" });
});
app.use("/auth", authRoutes_1.default);
app.use("/grades", gradeRoutes_1.default);
// Inicializar conexões com banco de dados
let isDatabaseConnected = false;
let isRedisConnected = false;
async function initializeConnections() {
    if (!isDatabaseConnected) {
        try {
            await (0, database_1.connectDatabase)();
            isDatabaseConnected = true;
        }
        catch (error) {
            console.error("Erro ao conectar no MongoDB:", error);
        }
    }
    if (!isRedisConnected) {
        try {
            await (0, redis_1.connectRedis)();
            isRedisConnected = true;
        }
        catch (error) {
            console.error("Erro ao conectar no Redis:", error);
        }
    }
}
// Inicializar conexões quando o módulo for carregado
initializeConnections();
// Para desenvolvimento local (não executar no Vercel)
// Verificar se está rodando como script principal e não no Vercel
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    async function startServer() {
        await initializeConnections();
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    }
    startServer();
}
// Exportar o app para uso no Vercel (serverless)
exports.default = app;
