import { Router } from "express";
import {
  login,
  protectedRoute,
  register,
  getProfile,
  updateProfile,
  changePassword
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/protected", authMiddleware, protectedRoute);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);

export default router;
