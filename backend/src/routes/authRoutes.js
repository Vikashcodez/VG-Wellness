import express from "express";
import { login, registerClient, getMe } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerClient);
router.get("/me", authenticate, getMe);

export default router;
