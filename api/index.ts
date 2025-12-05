import app from "../src/app";
import { connectDatabase } from "../src/database";
import { connectRedis } from "../src/database/redis";

// Inicializar conexões antes de processar requisições
let isInitialized = false;

async function initialize() {
  if (!isInitialized) {
    try {
      await connectDatabase();
      await connectRedis();
      isInitialized = true;
    } catch (error) {
      console.error("Erro ao inicializar conexões:", error);
    }
  }
}

// Inicializar conexões quando o módulo for carregado
initialize();

// Exportar o app Express para o Vercel
// O @vercel/node converterá automaticamente para uma função serverless
export default app;

