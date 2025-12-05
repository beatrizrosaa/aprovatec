import { Request, Response, NextFunction } from "express";
import { connectDatabase } from "../database";
import mongoose from "mongoose";

/**
 * Middleware para garantir que a conexão com o banco de dados está estabelecida
 * antes de processar qualquer requisição. Essencial para ambientes serverless.
 */
export async function ensureDatabaseConnection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Verificar se já está conectado
    if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
      return next();
    }

    // Tentar conectar se não estiver conectado
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Erro ao garantir conexão com o banco de dados:", error);
    res.status(500).json({
      message: "Erro ao conectar com o banco de dados",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined
    });
  }
}

