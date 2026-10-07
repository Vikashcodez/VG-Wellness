import express from "express";
import {
  getProducts, getProductById, getProductCategories, getProductBrands,
  getRecommendations, createRecommendation, createProduct
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/categories", authenticate, getProductCategories);
router.get("/brands", authenticate, getProductBrands);
router.get("/recommendations", authenticate, getRecommendations);
router.post("/recommendations", authenticate, authorize("SUPER_ADMIN", "ADMIN", "PRACTITIONER", "NUTRITIONIST", "THERAPIST"), createRecommendation);

router.get("/", authenticate, getProducts);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF"), createProduct);
router.get("/:id", authenticate, getProductById);

export default router;
