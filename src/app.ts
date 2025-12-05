import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./database";
import { connectRedis } from "./database/redis";
import authRoutes from "./routes/authRoutes";
import gradeRoutes from "./routes/gradeRoutes";

const app = express();

// Configuração do CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Lista de origens permitidas
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      // Permitir requisições do mesmo domínio (para desenvolvimento local)
      /^https:\/\/.*\.vercel\.app$/,
      // Permitir localhost em desenvolvimento
      /^http:\/\/localhost:\d+$/,
    ].filter(Boolean) as (string | RegExp)[];

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
    } else {
      // Em desenvolvimento, permitir todas as origens
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Não permitido pelo CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
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
