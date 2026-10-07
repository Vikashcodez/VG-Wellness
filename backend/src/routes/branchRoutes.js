import express from "express";
import { getOrganizations, getBranches } from "../controllers/branchController.js";

const router = express.Router();

router.get("/organizations", getOrganizations);
router.get("/", getBranches);

export default router;
