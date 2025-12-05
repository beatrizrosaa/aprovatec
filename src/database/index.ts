import mongoose from "mongoose";

// Cache da conexão para ambientes serverless
let cachedConnection: typeof mongoose | null = null;

export async function connectDatabase(): Promise<void> {
  // Se já estiver conectado, retornar
  if (mongoose.connection.readyState === 1) {
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

    cachedConnection = await mongoose.connect(uri, options);
    console.log("MongoDB conectado com sucesso");
  } catch (error) {
    console.error("Erro ao conectar no MongoDB:", error);
    cachedConnection = null;
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    process.exit(1);
  }
}
