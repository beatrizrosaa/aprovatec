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

const router = Router();

router.use(authMiddleware);

router.get("/", listSemesters);
router.get("/stats", getStats);
router.get("/summary", getSummary);
router.post("/", createSemester);
router.put("/:id", updateSemester);
router.delete("/:id", deleteSemester);

export default router;
