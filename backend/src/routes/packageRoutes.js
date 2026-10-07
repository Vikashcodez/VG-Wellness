import express from "express";
import { getPackages, getClientPackages } from "../controllers/packageController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getPackages);
router.get("/client", authenticate, getClientPackages);

export default router;
