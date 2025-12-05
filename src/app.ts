import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./database";
import { connectRedis } from "./database/redis";
import authRoutes from "./routes/authRoutes";
import gradeRoutes from "./routes/gradeRoutes";

const app = express();

// CORS - Permitir TODAS as origens sem restrições
app.use(cors({
  origin: "*", // Permite todas as origens sem restrições
  credentials: false, // Desabilitado quando origin é "*"
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: "*", // Permite todos os headers
  exposedHeaders: "*",
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware adicional para garantir CORS em todas as requisições
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Expose-Headers", "*");
  res.header("Access-Control-Max-Age", "86400");
  
  // Responder imediatamente a requisições OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  next();
});

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
