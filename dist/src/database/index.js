"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
// Cache da conexão para ambientes serverless
let cachedConnection = null;
async function connectDatabase() {
    // Se já estiver conectado, retornar
    if (mongoose_1.default.connection.readyState === 1) {
        return;
    }
    // Se já existe uma conexão em cache, usar ela
    if (cachedConnection) {
        return;
    }
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI não definido no .env");
        if (process.env.NODE_ENV === "production") {
            throw new Error("MONGO_URI não definido");
        }
        process.exit(1);
    }
    try {
        // Configurações otimizadas para serverless
        const options = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        cachedConnection = await mongoose_1.default.connect(uri, options);
        console.log("MongoDB conectado com sucesso");
    }
    catch (error) {
        console.error("Erro ao conectar no MongoDB:", error);
        cachedConnection = null;
        if (process.env.NODE_ENV === "production") {
            throw error;
        }
        process.exit(1);
    }
}
