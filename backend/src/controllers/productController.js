import { productService } from "../services/productService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";
import pool from "../config/db.js";

export const getProducts = async (req, res, next) => {
  try {
    const { categoryId, brandId, search } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    const products = await productService.getAllProducts({
      organizationId,
      branchId,
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
    const { organizationId } = getTenantScope(req);
    let q = "SELECT * FROM product_categories WHERE is_active = true";
    const params = [];
    if (organizationId) {
      params.push(organizationId);
      q += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    q += " ORDER BY name ASC";
    const categories = (await pool.query(q, params)).rows;
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getProductBrands = async (req, res, next) => {
  try {
    const { organizationId } = getTenantScope(req);
    let q = "SELECT * FROM product_brands WHERE is_active = true";
    const params = [];
    if (organizationId) {
      params.push(organizationId);
      q += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    q += " ORDER BY name ASC";
    const brands = (await pool.query(q, params)).rows;
    res.json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const createProductCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { organizationId } = getTenantScope(req);
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
    const insertRes = await pool.query(
      "INSERT INTO product_categories (organization_id, name, description, is_active) VALUES ($1, $2, $3, true) RETURNING *",
      [organizationId, name.trim(), description || ""]
    );
    res.status(201).json({ success: true, message: "Product category created successfully", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createProductBrand = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { organizationId } = getTenantScope(req);
    if (!name) return res.status(400).json({ success: false, message: "Brand name is required" });
    const insertRes = await pool.query(
      "INSERT INTO product_brands (organization_id, name, description, is_active) VALUES ($1, $2, $3, true) RETURNING *",
      [organizationId, name.trim(), description || ""]
    );
    res.status(201).json({ success: true, message: "Product brand created successfully", data: insertRes.rows[0] });
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
    const { organizationId, branchId } = getTenantScope(req);
    if (!name || !sku || price === undefined) {
      return res.status(400).json({ success: false, message: "Name, SKU and price are required" });
    }

    const insertRes = await pool.query(
      `INSERT INTO products (organization_id, branch_id, name, sku, category_id, brand_id, description, price, cost_price, tax_rate, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       RETURNING *`,
      [organizationId, branchId, name, sku, categoryId || null, brandId || null, description || "", price, costPrice || 0, taxRate || 18, imageUrl || null]
    );

    res.status(201).json({ success: true, message: "Product created", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, categoryId, brandId, description, price, costPrice, taxRate, imageUrl, isActive } = req.body;
    const updateRes = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           sku = COALESCE($2, sku),
           category_id = COALESCE($3, category_id),
           brand_id = COALESCE($4, brand_id),
           description = COALESCE($5, description),
           price = COALESCE($6, price),
           cost_price = COALESCE($7, cost_price),
           tax_rate = COALESCE($8, tax_rate),
           image_url = COALESCE($9, image_url),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [name, sku, categoryId, brandId, description, price, costPrice, taxRate, imageUrl, isActive, id]
    );
    if (updateRes.rowCount === 0) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product updated successfully", data: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    res.json({ success: true, message: "Product deactivated successfully" });
  } catch (error) {
    next(error);
  }
};
