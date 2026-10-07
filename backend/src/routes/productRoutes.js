import express from "express";
import {
  getProducts, getProductById, getProductCategories, createProductCategory,
  getProductBrands, createProductBrand,
  getRecommendations, createRecommendation, createProduct, updateProduct, deleteProduct
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/categories", authenticate, getProductCategories);
router.post("/categories", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), createProductCategory);
router.get("/brands", authenticate, getProductBrands);
router.post("/brands", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), createProductBrand);
router.get("/recommendations", authenticate, getRecommendations);
router.post("/recommendations", authenticate, authorize("SUPER_ADMIN", "ADMIN", "PRACTITIONER", "NUTRITIONIST", "THERAPIST"), createRecommendation);

router.get("/", authenticate, getProducts);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), createProduct);
router.get("/:id", authenticate, getProductById);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), updateProduct);
router.delete("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN"), deleteProduct);

export default router;
