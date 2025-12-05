import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./database";
import { connectRedis } from "./database/redis";
import authRoutes from "./routes/authRoutes";
import gradeRoutes from "./routes/gradeRoutes";

const app = express();

// Configuração do CORS - Permissiva para Vercel deployments
// Em produção no Vercel, permitir todas as origens do Vercel
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Se não há origin, permitir (requisições server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir todas as URLs do Vercel (produção e preview deployments)
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    // Permitir localhost em desenvolvimento
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Verificar FRONTEND_URL se estiver definido
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    // Em desenvolvimento, permitir todas as origens
    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      return callback(null, true);
    }

    // Em produção no Vercel, se não for Vercel.app, ainda permitir
    // (pode ser necessário para integrações)
    console.log(`CORS permitindo origin: ${origin}`);
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Aplicar CORS antes de qualquer outro middleware
app.use(cors(corsOptions));

// Handler explícito para OPTIONS (preflight) como fallback adicional
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  }
  res.status(200).end();
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
