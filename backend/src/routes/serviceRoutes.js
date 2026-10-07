import express from "express";
import { getServices, getCategories } from "../controllers/serviceController.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/", getServices);

export default router;
