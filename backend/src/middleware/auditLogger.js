import pool from "../config/db.js";

export async function logAudit({
  userId = null,
  action,
  module,
  entityType = null,
  entityId = null,
  oldData = null,
  newData = null,
  ipAddress = null
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, old_data, new_data, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        module,
        entityType,
        entityId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress
      ]
    );
  } catch (err) {
    console.error("Audit log creation error:", err.message);
  }
}
