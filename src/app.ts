import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./database";
import { connectRedis } from "./database/redis";
import authRoutes from "./routes/authRoutes";
import gradeRoutes from "./routes/gradeRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API AprovaTec funcionando" });
});

app.use("/auth", authRoutes);
app.use("/grades", gradeRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();
  await connectRedis();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
