import type { VercelRequest, VercelResponse } from "@vercel/node";
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

// Handler serverless para o Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Inicializar conexões se ainda não foram inicializadas
  await initialize();
  
  // Processar a requisição com o app Express
  return app(req, res);
}

