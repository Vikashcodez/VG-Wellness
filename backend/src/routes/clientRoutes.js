import express from "express";
import { getClients, getClientById, getMyProfile, createClient, updateClient } from "../controllers/clientController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me/profile", authenticate, getMyProfile);

router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "PRACTITIONER", "NUTRITIONIST", "THERAPIST", "BILLING_STAFF"), getClients);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST"), createClient);
router.get("/:id", authenticate, getClientById);
router.put("/:id", authenticate, updateClient);

export default router;
