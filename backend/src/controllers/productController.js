import { productService } from "../services/productService.js";
import pool from "../config/db.js";

export const getProducts = async (req, res, next) => {
  try {
    const { categoryId, brandId, search } = req.query;
    const products = await productService.getAllProducts({
      categoryId: categoryId ? parseInt(categoryId) : null,
      brandId: brandId ? parseInt(brandId) : null,
      search
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductCategories = async (req, res, next) => {
  try {
    const categories = (await pool.query("SELECT * FROM product_categories WHERE is_active = true ORDER BY name ASC")).rows;
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getProductBrands = async (req, res, next) => {
  try {
    const brands = (await pool.query("SELECT * FROM product_brands WHERE is_active = true ORDER BY name ASC")).rows;
    res.json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await productService.getProductById(productId);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    const recs = await productService.getRecommendations(parseInt(clientId));
    res.json({ success: true, data: recs });
  } catch (error) {
    next(error);
  }
};

export const createRecommendation = async (req, res, next) => {
  try {
    const { clientId, productId, reason, dosageNotes } = req.body;
    if (!clientId || !productId || !reason) {
      return res.status(400).json({ success: false, message: "clientId, productId and reason are required" });
    }

    const rec = await productService.createRecommendation({
      clientId,
      practitionerId: req.user.practitionerId || null,
      productId,
      reason,
      dosageNotes
    });

    res.status(201).json({ success: true, message: "Recommendation created", data: rec });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, categoryId, brandId, description, price, costPrice, taxRate, imageUrl } = req.body;
    if (!name || !sku || price === undefined) {
      return res.status(400).json({ success: false, message: "Name, SKU and price are required" });
    }

    const insertRes = await pool.query(
      `INSERT INTO products (name, sku, category_id, brand_id, description, price, cost_price, tax_rate, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [name, sku, categoryId || null, brandId || null, description || "", price, costPrice || 0, taxRate || 18, imageUrl || null]
    );

    res.status(201).json({ success: true, message: "Product created", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};
