import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const financeService = {
  async getFinancialOverview({ organizationId = 1, branchId }) {
    let branchClause = "";
    const params = [organizationId];

    if (branchId) {
      params.push(branchId);
      branchClause = `AND branch_id = $${params.length}`;
    }

    // 1. Total Revenue from Payments
    const revRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue
       FROM payments
       WHERE organization_id = $1 ${branchClause}`,
      params
    );
    const totalRevenue = parseFloat(revRes.rows[0].total_revenue);

    // 2. Total Expenses
    const expRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses,
              COALESCE(SUM(tax_amount), 0) as total_tax
       FROM expenses
       WHERE organization_id = $1 ${branchClause}`,
      params
    );
    const totalExpenses = parseFloat(expRes.rows[0].total_expenses);
    const totalExpenseTax = parseFloat(expRes.rows[0].total_tax);

    // 3. Net Profit & Margin
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    // 4. Accounts Receivable (Unpaid/Partial Invoices)
    const arRes = await pool.query(
      `SELECT COALESCE(SUM(balance_amount), 0) as accounts_receivable,
              COUNT(id) as outstanding_invoices_count
       FROM invoices
       WHERE organization_id = $1 AND balance_amount > 0 AND status NOT IN ('PAID', 'CANCELLED') ${branchClause}`,
      params
    );
    const accountsReceivable = parseFloat(arRes.rows[0].accounts_receivable);
    const outstandingInvoicesCount = parseInt(arRes.rows[0].outstanding_invoices_count);

    // 5. Expense Breakdown by Category
    const expByCategory = (await pool.query(
      `SELECT COALESCE(ec.name, 'Uncategorized') as category_name,
              COALESCE(SUM(e.amount), 0) as total_amount,
              COUNT(e.id) as expense_count
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.organization_id = $1 ${branchClause}
       GROUP BY ec.name
       ORDER BY total_amount DESC`,
      params
    )).rows;

    // 6. Recent Expenses
    const recentExpenses = (await pool.query(
      `SELECT e.*, ec.name as category_name, b.name as branch_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.organization_id = $1 ${branchClause}
       ORDER BY e.payment_date DESC, e.created_at DESC LIMIT 10`,
      params
    )).rows;

    return {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalExpenseTax,
        accountsReceivable,
        outstandingInvoicesCount
      },
      expenseByCategory: expByCategory,
      recentExpenses
    };
  },

  async getExpenses({ organizationId = 1, branchId, categoryId, dateFrom, dateTo, search }) {
    let query = `
      SELECT e.*, ec.name as category_name, b.name as branch_name,
             u.first_name as recorded_by_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN users u ON e.recorded_by = u.id
      WHERE e.organization_id = $1
    `;
    const params = [organizationId];

    if (branchId) {
      params.push(branchId);
      query += ` AND e.branch_id = $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      query += ` AND e.category_id = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND e.payment_date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      query += ` AND e.payment_date <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.title ILIKE $${params.length} OR e.expense_code ILIKE $${params.length} OR e.vendor_payee ILIKE $${params.length} OR e.reference_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY e.payment_date DESC, e.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async createExpense(data, creatorUserId) {
    const {
      organizationId = 1, branchId = 1, expenseCode, categoryId,
      title, amount, taxAmount = 0.00, paymentDate,
      paymentMethod = "BANK_TRANSFER", vendorPayee, referenceNumber, notes
    } = data;

    if (!title || !amount || !vendorPayee) {
      throw new Error("Expense Title, Amount, and Vendor/Payee are required");
    }

    let code = expenseCode;
    if (!code) {
      const countRes = await pool.query("SELECT COUNT(*) FROM expenses");
      code = `EXP-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;
    }

    const res = await pool.query(
      `INSERT INTO expenses (
        organization_id, branch_id, expense_code, category_id,
        title, amount, tax_amount, payment_date,
        payment_method, vendor_payee, reference_number, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        organizationId, branchId, code, categoryId || null,
        title, parseFloat(amount), parseFloat(taxAmount || 0),
        paymentDate || new Date().toISOString().split("T")[0],
        paymentMethod, vendorPayee, referenceNumber || null,
        notes || null, creatorUserId
      ]
    );

    logAudit({
      userId: creatorUserId,
      action: "EXPENSE_RECORDED",
      module: "FINANCE",
      entityType: "expenses",
      entityId: res.rows[0].id,
      newData: res.rows[0]
    });

    return res.rows[0];
  },

  async getExpenseCategories(organizationId = 1) {
    const res = await pool.query(
      "SELECT * FROM expense_categories WHERE organization_id = $1 ORDER BY name ASC",
      [organizationId]
    );
    return res.rows;
  },

  async createExpenseCategory(name, description, organizationId = 1) {
    if (!name) throw new Error("Category Name is required");
    const res = await pool.query(
      `INSERT INTO expense_categories (organization_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [organizationId, name, description || null]
    );
    return res.rows[0];
  }
};
