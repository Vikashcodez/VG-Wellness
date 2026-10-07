import express from "express";
import { getOrganizations, getBranches } from "../controllers/branchController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/organizations", authenticate, getOrganizations);
router.get("/", authenticate, getBranches);

export default router;
