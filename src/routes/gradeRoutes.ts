import { Router } from "express";
import {
  createSemester,
  deleteSemester,
  listSemesters,
  updateSemester
} from "../controllers/gradeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", listSemesters);
router.post("/", createSemester);
router.put("/:id", updateSemester);
router.delete("/:id", deleteSemester);

export default router;
