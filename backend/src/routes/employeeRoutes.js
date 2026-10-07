import express from "express";
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, updateEmployeePermissions, deleteEmployee } from "../controllers/employeeController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getEmployees);
router.get("/:id", authenticate, getEmployeeById);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN"), createEmployee);
router.put("/:id/permissions", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN"), updateEmployeePermissions);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN"), updateEmployee);
router.delete("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN"), deleteEmployee);

export default router;
