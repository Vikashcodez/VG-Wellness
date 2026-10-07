import express from "express";
import { getCart, addToCart, updateCartItem } from "../controllers/cartController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getCart);
router.post("/items", authenticate, addToCart);
router.put("/items", authenticate, updateCartItem);

export default router;
