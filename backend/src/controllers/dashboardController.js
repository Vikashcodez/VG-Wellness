import pool from "../config/db.js";
import { calculateGoalProgress } from "../utils/goalCalculator.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getAdminDashboard = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);

    const buildClause = (tableAlias = "") => {
      const prefix = tableAlias ? `${tableAlias}.` : "";
      let clause = "";
      if (scope.organizationId) {
        clause += ` AND ${prefix}organization_id = ${scope.organizationId}`;
      }
      if (scope.branchId) {
        clause += ` AND ${prefix}branch_id = ${scope.branchId}`;
      }
      return clause;
    };

    const filter = buildClause();
    const filterA = buildClause("a");

    // Today's appointments
    const todayAppts = await pool.query(
      `SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE ${filter}`
    );

    // Today's revenue
    const todayRev = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date = CURRENT_DATE ${filter}`
    );

    // Monthly revenue
    const monthRev = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE) ${filter}`
    );

    // Clients count
    const totalClients = await pool.query(`SELECT COUNT(*) FROM clients WHERE is_active = true ${filter}`);
    const newClientsMonth = await pool.query(
      `SELECT COUNT(*) FROM clients WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) ${filter}`
    );

    // Goals count
    const activeGoals = await pool.query(`SELECT COUNT(*) FROM wellness_goals WHERE status = 'ACTIVE' ${filter}`);
    const achievedGoals = await pool.query(`SELECT COUNT(*) FROM wellness_goals WHERE status = 'ACHIEVED' ${filter}`);

    // Plans & Packages
    const activePlans = await pool.query(
      `SELECT COUNT(*) FROM client_wellness_plans cwp JOIN clients c ON cwp.client_id = c.id WHERE cwp.status = 'ACTIVE' ${buildClause("c")}`
    );

    // Inventory & Orders
    const lowStock = await pool.query(`SELECT COUNT(*) FROM inventory_stock WHERE quantity <= 10 ${filter}`);
    const pendingOrders = await pool.query(`SELECT COUNT(*) FROM orders WHERE status = 'PENDING' ${filter}`);
    const outstandingInvoices = await pool.query(
      `SELECT COALESCE(SUM(balance_amount), 0) as total FROM invoices WHERE balance_amount > 0 AND status NOT IN ('PAID', 'CANCELLED') ${filter}`
    );

    // Chart: Daily revenue for last 7 days
    const revChart = await pool.query(
      `SELECT TO_CHAR(payment_date, 'YYYY-MM-DD') as date, COALESCE(SUM(amount), 0) as revenue
       FROM payments
       WHERE payment_date >= CURRENT_DATE - INTERVAL '6 days' ${filter}
       GROUP BY payment_date ORDER BY payment_date ASC`
    );

    // Chart: Appointments by status
    const apptStatusChart = await pool.query(
      `SELECT status, COUNT(*) as count FROM appointments WHERE 1=1 ${filter} GROUP BY status`
    );

    // Upcoming 5 appointments today
    const upcomingToday = await pool.query(
      `SELECT a.*, c.first_name as client_first_name, c.last_name as client_last_name, s.name as service_name,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       JOIN practitioners p ON a.practitioner_id = p.id
       WHERE a.appointment_date = CURRENT_DATE ${filterA}
       ORDER BY a.start_time ASC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        kpis: {
          todayAppointments: parseInt(todayAppts.rows[0].count),
          todayRevenue: parseFloat(todayRev.rows[0].total),
          monthlyRevenue: parseFloat(monthRev.rows[0].total),
          activeClients: parseInt(totalClients.rows[0].count),
          newClientsThisMonth: parseInt(newClientsMonth.rows[0].count),
          activeGoals: parseInt(activeGoals.rows[0].count),
          achievedGoals: parseInt(achievedGoals.rows[0].count),
          activeWellnessPlans: parseInt(activePlans.rows[0].count),
          lowStockCount: parseInt(lowStock.rows[0].count),
          pendingOrders: parseInt(pendingOrders.rows[0].count),
          outstandingPayments: parseFloat(outstandingInvoices.rows[0].total)
        },
        revenueTrend: revChart.rows,
        appointmentDistribution: apptStatusChart.rows,
        upcomingToday: upcomingToday.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getClientDashboard = async (req, res, next) => {
  try {
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(404).json({ success: false, message: "Client profile not found" });
    }

    // 1. Next upcoming appointment
    const nextAppt = await pool.query(
      `SELECT a.*, s.name as service_name, s.duration_minutes,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name, p.qualification
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN practitioners p ON a.practitioner_id = p.id
       WHERE a.client_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.status IN ('BOOKED', 'CONFIRMED')
       ORDER BY a.appointment_date ASC, a.start_time ASC LIMIT 1`,
      [clientId]
    );

    // 2. Active goals with progress
    const activeGoals = (await pool.query(
      `SELECT g.*, gt.name as goal_type_name
       FROM wellness_goals g
       LEFT JOIN goal_types gt ON g.goal_type_id = gt.id
       WHERE g.client_id = $1 AND g.status = 'ACTIVE'
       ORDER BY g.created_at DESC`,
      [clientId]
    )).rows;

    const fullActiveGoals = [];
    for (const g of activeGoals) {
      const tgt = (await pool.query("SELECT * FROM goal_targets WHERE goal_id = $1", [g.id])).rows[0];
      const milestones = (await pool.query("SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY sequence_order ASC", [g.id])).rows;
      const measurements = (await pool.query("SELECT * FROM goal_measurements WHERE goal_id = $1 ORDER BY recorded_date ASC", [g.id])).rows;

      let progress = null;
      if (tgt) {
        progress = calculateGoalProgress(tgt.starting_value, tgt.current_value, tgt.target_value, tgt.direction);
      }
      fullActiveGoals.push({ ...g, target: tgt, progress, milestones, measurements });
    }

    // 3. Active wellness plan
    const activePlan = (await pool.query(
      `SELECT cwp.*, wp.name as plan_name, wp.description as plan_description, wp.duration_weeks,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM client_wellness_plans cwp
       JOIN wellness_plans wp ON cwp.wellness_plan_id = wp.id
       LEFT JOIN practitioners p ON cwp.practitioner_id = p.id
       WHERE cwp.client_id = $1 AND cwp.status = 'ACTIVE' LIMIT 1`,
      [clientId]
    )).rows[0] || null;

    // 4. Active package & membership
    const activePackage = (await pool.query(
      `SELECT cp.*, p.name as package_name FROM client_packages cp
       JOIN packages p ON cp.package_id = p.id
       WHERE cp.client_id = $1 AND cp.status = 'ACTIVE' LIMIT 1`,
      [clientId]
    )).rows[0] || null;

    const activeMembership = (await pool.query(
      `SELECT cm.*, mp.name as plan_name, mp.tier, mp.discount_percent FROM client_memberships cm
       JOIN membership_plans mp ON cm.membership_plan_id = mp.id
       WHERE cm.client_id = $1 AND cm.status = 'ACTIVE' LIMIT 1`,
      [clientId]
    )).rows[0] || null;

    // 5. Recommended products
    const recommendedProducts = (await pool.query(
      `SELECT pr.*, p.name as product_name, p.price, p.image_url, p.sku
       FROM product_recommendations pr
       JOIN products p ON pr.product_id = p.id
       WHERE pr.client_id = $1 AND pr.status = 'ACTIVE' LIMIT 4`,
      [clientId]
    )).rows;

    // 6. Outstanding balance & recent invoice
    const balanceRes = await pool.query(
      `SELECT COALESCE(SUM(balance_amount), 0) as balance FROM invoices WHERE client_id = $1 AND status NOT IN ('PAID', 'CANCELLED')`,
      [clientId]
    );

    const recentInvoices = (await pool.query(
      `SELECT * FROM invoices WHERE client_id = $1 ORDER BY invoice_date DESC LIMIT 3`,
      [clientId]
    )).rows;

    const recentPayments = (await pool.query(
      `SELECT * FROM payments WHERE client_id = $1 ORDER BY payment_date DESC LIMIT 3`,
      [clientId]
    )).rows;

    res.json({
      success: true,
      data: {
        nextAppointment: nextAppt.rows[0] || null,
        goals: fullActiveGoals,
        wellnessPlan: activePlan,
        package: activePackage,
        membership: activeMembership,
        recommendedProducts,
        outstandingBalance: parseFloat(balanceRes.rows[0].balance),
        recentInvoices,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};
