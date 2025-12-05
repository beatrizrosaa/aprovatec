"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectDatabase() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI não definido no .env");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log("MongoDB conectado com sucesso");
    }
    catch (error) {
        console.error("Erro ao conectar no MongoDB:", error);
        process.exit(1);
    }
}
