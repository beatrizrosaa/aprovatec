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
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ message: "API AprovaTec funcionando" });
});
app.use("/auth", authRoutes_1.default);
app.use("/grades", gradeRoutes_1.default);
const PORT = process.env.PORT || 3000;
async function startServer() {
    await (0, database_1.connectDatabase)();
    await (0, redis_1.connectRedis)();
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
startServer();
