import express from "express";
import { getPractitioners, getPractitionerById } from "../controllers/practitionerController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getPractitioners);
router.get("/:id", authenticate, getPractitionerById);

export default router;
