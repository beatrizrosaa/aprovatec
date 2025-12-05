import { Router } from "express";
import {
  createSemester,
  deleteSemester,
  getStats,
  getSummary,
  listSemesters,
  updateSemester
} from "../controllers/gradeController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ensureDatabaseConnection } from "../middlewares/dbMiddleware";

const router = Router();

// Aplicar middleware de conexão do banco antes do authMiddleware
router.use(ensureDatabaseConnection);
router.use(authMiddleware);

router.get("/", listSemesters);
router.get("/stats", getStats);
router.get("/summary", getSummary);
router.post("/", createSemester);
router.put("/:id", updateSemester);
router.delete("/:id", deleteSemester);

export default router;
