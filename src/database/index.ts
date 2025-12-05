import mongoose from "mongoose";

// Cache da conexão para ambientes serverless
let cachedConnection: typeof mongoose | null = null;
// Promise para evitar múltiplas tentativas de conexão simultâneas
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  // Se já estiver conectado, retornar
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Se já existe uma conexão em cache e está conectada, usar ela
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return;
  }

  // Se já existe uma promise de conexão em andamento, aguardar ela
  if (connectionPromise) {
    try {
      await connectionPromise;
      return;
    } catch (error) {
      // Se a conexão anterior falhou, tentar novamente
      connectionPromise = null;
    }
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI não definido no .env");
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGO_URI não definido");
    }
    process.exit(1);
  }

  // Criar uma nova promise de conexão
  connectionPromise = (async () => {
    try {
      // Configurações otimizadas para serverless
      const options = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      const connection = await mongoose.connect(uri, options);
      cachedConnection = connection;
      console.log("MongoDB conectado com sucesso");
      return connection;
    } catch (error) {
      console.error("Erro ao conectar no MongoDB:", error);
      cachedConnection = null;
      connectionPromise = null;
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
      process.exit(1);
    }
  })();

  await connectionPromise;
}
