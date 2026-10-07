import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getReports = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const { type = "revenue", dateFrom, dateTo, exportCsv = false } = req.query;

    let data = [];

    const getTenantClause = (alias) => {
      let clause = "";
      if (scope.organizationId) {
        clause += ` AND ${alias}.organization_id = ${scope.organizationId}`;
      }
      if (scope.branchId) {
        clause += ` AND ${alias}.branch_id = ${scope.branchId}`;
      }
      return clause;
    };

    if (type === "revenue") {
      const q = `
        SELECT p.payment_date, p.payment_method, SUM(p.amount) as total_amount, COUNT(p.id) as payment_count
        FROM payments p
        WHERE 1=1 ${getTenantClause("p")}
        ${dateFrom ? `AND p.payment_date >= '${dateFrom}'` : ""}
        ${dateTo ? `AND p.payment_date <= '${dateTo}'` : ""}
        GROUP BY p.payment_date, p.payment_method
        ORDER BY p.payment_date DESC
      `;
      data = (await pool.query(q)).rows;
    } else if (type === "appointments") {
      const q = `
        SELECT a.appointment_date, a.status, s.name as service_name,
               p.first_name || ' ' || p.last_name as practitioner_name,
               c.first_name || ' ' || c.last_name as client_name,
               a.booking_source
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN practitioners p ON a.practitioner_id = p.id
        JOIN clients c ON a.client_id = c.id
        WHERE 1=1 ${getTenantClause("a")}
        ${dateFrom ? `AND a.appointment_date >= '${dateFrom}'` : ""}
        ${dateTo ? `AND a.appointment_date <= '${dateTo}'` : ""}
        ORDER BY a.appointment_date DESC
      `;
      data = (await pool.query(q)).rows;
    } else if (type === "goals") {
      const q = `
        SELECT g.goal_name, g.status, g.priority, g.start_date, g.target_date,
               gt.metric_name, gt.starting_value, gt.current_value, gt.target_value, gt.unit, gt.direction,
               c.first_name || ' ' || c.last_name as client_name
        FROM wellness_goals g
        JOIN clients c ON g.client_id = c.id
        LEFT JOIN goal_targets gt ON gt.goal_id = g.id
        WHERE 1=1 ${getTenantClause("g")}
        ORDER BY g.created_at DESC
      `;
      data = (await pool.query(q)).rows;
    } else if (type === "inventory") {
      const q = `
        SELECT p.name as product_name, p.sku, pc.name as category,
               s.batch_number, s.expiry_date, s.quantity, s.purchase_price, s.selling_price,
               (s.quantity * s.selling_price) as total_valuation
        FROM inventory_stock s
        JOIN products p ON s.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE 1=1 ${getTenantClause("s")}
        ORDER BY s.quantity ASC
      `;
      data = (await pool.query(q)).rows;
    } else if (type === "outstanding") {
      const q = `
        SELECT inv.invoice_number, inv.invoice_date, inv.total_amount, inv.paid_amount, inv.balance_amount, inv.status,
               c.first_name || ' ' || c.last_name as client_name, c.mobile
        FROM invoices inv
        JOIN clients c ON inv.client_id = c.id
        WHERE inv.balance_amount > 0 AND inv.status NOT IN ('PAID', 'CANCELLED')
        ${getTenantClause("inv")}
        ORDER BY inv.balance_amount DESC
      `;
      data = (await pool.query(q)).rows;
    } else {
      // Default: recent orders
      const q = `
        SELECT o.order_number, o.created_at, o.total_amount, o.status, o.payment_status,
               c.first_name || ' ' || c.last_name as client_name
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        WHERE 1=1 ${getTenantClause("o")}
        ORDER BY o.created_at DESC
      `;
      data = (await pool.query(q)).rows;
    }

    if (exportCsv === "true" || exportCsv === true) {
      if (data.length === 0) {
        return res.send("No data found");
      }
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(row => Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));
      const csv = [headers, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${type}_report.csv"`);
      return res.send(csv);
    }

    res.json({ success: true, type, count: data.length, data });
  } catch (error) {
    next(error);
  }
};
