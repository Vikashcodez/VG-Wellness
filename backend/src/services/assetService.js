import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const assetService = {
  async getAssets({ organizationId, branchId, category, status, search }) {
    let query = `
      SELECT a.*, b.name as branch_name, o.name as organization_name,
             (SELECT COUNT(*) FROM asset_maintenance_logs aml WHERE aml.asset_id = a.id) as maintenance_count,
             (SELECT MAX(aml.service_date) FROM asset_maintenance_logs aml WHERE aml.asset_id = a.id) as last_maintenance_date
      FROM assets a
      LEFT JOIN branches b ON a.branch_id = b.id
      LEFT JOIN organizations o ON a.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND a.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND a.branch_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND a.category = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.name ILIKE $${params.length} OR a.asset_code ILIKE $${params.length} OR a.serial_number ILIKE $${params.length} OR a.vendor_name ILIKE $${params.length})`;
    }

    query += ` ORDER BY a.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getAssetById(id) {
    const assetRes = await pool.query(
      `SELECT a.*, b.name as branch_name, o.name as organization_name
       FROM assets a
       LEFT JOIN branches b ON a.branch_id = b.id
       LEFT JOIN organizations o ON a.organization_id = o.id
       WHERE a.id = $1`,
      [id]
    );
    if (assetRes.rowCount === 0) throw new Error("Asset not found");

    const logs = (await pool.query(
      `SELECT aml.*, u.first_name as user_first_name, u.last_name as user_last_name
       FROM asset_maintenance_logs aml
       LEFT JOIN users u ON aml.created_by = u.id
       WHERE aml.asset_id = $1
       ORDER BY aml.service_date DESC, aml.created_at DESC`,
      [id]
    )).rows;

    return {
      asset: assetRes.rows[0],
      maintenanceLogs: logs
    };
  },

  async createAsset(data, creatorUserId) {
    const {
      organizationId = 1, branchId = 1, assetCode, name, category,
      serialNumber, purchaseDate, purchaseCost, currentValue, locationRoom,
      status = "OPERATIONAL", vendorName, warrantyExpiry, nextServiceDate, notes
    } = data;

    if (!name || !category || purchaseCost === undefined) {
      throw new Error("Asset Name, Category, and Purchase Cost are required");
    }

    let code = assetCode;
    if (!code) {
      const countRes = await pool.query("SELECT COUNT(*) FROM assets");
      code = `AST-${String(parseInt(countRes.rows[0].count) + 1).padStart(3, "0")}`;
    }

    const res = await pool.query(
      `INSERT INTO assets (
        organization_id, branch_id, asset_code, name, category,
        serial_number, purchase_date, purchase_cost, current_value,
        location_room, status, vendor_name, warranty_expiry, next_service_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        organizationId, branchId, code, name, category,
        serialNumber || null, purchaseDate || new Date().toISOString().split("T")[0],
        purchaseCost, currentValue || purchaseCost, locationRoom || "General Facility",
        status, vendorName || null, warrantyExpiry || null, nextServiceDate || null,
        notes || null, creatorUserId
      ]
    );

    logAudit({
      userId: creatorUserId,
      action: "ASSET_CREATED",
      module: "ASSETS",
      entityType: "assets",
      entityId: res.rows[0].id,
      newData: res.rows[0]
    });

    return res.rows[0];
  },

  async updateAsset(id, data, updaterUserId) {
    const {
      name, category, branchId, currentValue, locationRoom, status,
      vendorName, warrantyExpiry, nextServiceDate, notes
    } = data;

    const res = await pool.query(
      `UPDATE assets
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           branch_id = COALESCE($3, branch_id),
           current_value = COALESCE($4, current_value),
           location_room = COALESCE($5, location_room),
           status = COALESCE($6, status),
           vendor_name = COALESCE($7, vendor_name),
           warranty_expiry = COALESCE($8, warranty_expiry),
           next_service_date = COALESCE($9, next_service_date),
           notes = COALESCE($10, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [name, category, branchId, currentValue, locationRoom, status, vendorName, warrantyExpiry, nextServiceDate, notes, id]
    );

    logAudit({
      userId: updaterUserId,
      action: "ASSET_UPDATED",
      module: "ASSETS",
      entityType: "assets",
      entityId: id,
      newData: data
    });

    return res.rows[0];
  },

  async addMaintenanceLog(assetId, data, creatorUserId) {
    const { serviceDate, maintenanceType, cost, performedBy, notes, nextDueDate } = data;

    if (!maintenanceType || !performedBy) {
      throw new Error("Maintenance Type and Performed By are required");
    }

    const res = await pool.query(
      `INSERT INTO asset_maintenance_logs (
        asset_id, service_date, maintenance_type, cost, performed_by, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        assetId,
        serviceDate || new Date().toISOString().split("T")[0],
        maintenanceType,
        cost || 0.00,
        performedBy,
        notes || null,
        creatorUserId
      ]
    );

    // Update asset's last serviced date and next service date if provided
    await pool.query(
      `UPDATE assets
       SET last_serviced_date = $1,
           next_service_date = COALESCE($2, next_service_date),
           status = 'OPERATIONAL',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [serviceDate || new Date().toISOString().split("T")[0], nextDueDate || null, assetId]
    );

    return res.rows[0];
  }
};
