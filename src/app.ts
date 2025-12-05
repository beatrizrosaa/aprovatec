import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./database";
import { connectRedis } from "./database/redis";
import authRoutes from "./routes/authRoutes";
import gradeRoutes from "./routes/gradeRoutes";

const app = express();

// CORS - Permitir todas as origens (sem restrições)
app.use(cors({
  origin: true, // Permite todas as origens
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API AprovaTec funcionando" });
});

app.use("/auth", authRoutes);
app.use("/grades", gradeRoutes);

// Inicializar conexões com banco de dados
let isDatabaseConnected = false;
let isRedisConnected = false;

async function initializeConnections() {
  if (!isDatabaseConnected) {
    try {
      await connectDatabase();
      isDatabaseConnected = true;
    } catch (error) {
      console.error("Erro ao conectar no MongoDB:", error);
    }
  }

  if (!isRedisConnected) {
    try {
      await connectRedis();
      isRedisConnected = true;
    } catch (error) {
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
export default app;
