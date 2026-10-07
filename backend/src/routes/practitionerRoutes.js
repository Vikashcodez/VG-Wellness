import express from "express";
import { getPractitioners, getPractitionerById } from "../controllers/practitionerController.js";

const router = express.Router();

router.get("/", getPractitioners);
router.get("/:id", getPractitionerById);

export default router;
