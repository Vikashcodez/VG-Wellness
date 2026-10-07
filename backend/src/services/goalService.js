import pool from "../config/db.js";
import { calculateGoalProgress } from "../utils/goalCalculator.js";
import { logAudit } from "../middleware/auditLogger.js";

export const goalService = {
  async getGoalCategoriesAndTypes() {
    const cats = (await pool.query("SELECT * FROM goal_categories ORDER BY name ASC")).rows;
    const types = (await pool.query(
      `SELECT gt.*, gc.name as category_name
       FROM goal_types gt
       LEFT JOIN goal_categories gc ON gt.category_id = gc.id
       ORDER BY gt.name ASC`
    )).rows;

    return { categories: cats, types };
  },

  async getClientGoals(clientId, organizationId = null) {
    let query = `
      SELECT g.*, gt.name as goal_type_name, gt.target_direction, gt.default_unit,
             p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
      FROM wellness_goals g
      LEFT JOIN goal_types gt ON g.goal_type_id = gt.id
      LEFT JOIN practitioners p ON g.practitioner_id = p.id
      WHERE g.client_id = $1
    `;
    const params = [clientId];
    if (organizationId) {
      params.push(organizationId);
      query += ` AND g.organization_id = $${params.length}`;
    }
    query += ` ORDER BY g.created_at DESC`;
    const goalsRes = await pool.query(query, params);

    const fullGoals = [];
    for (const g of goalsRes.rows) {
      const targetRes = await pool.query("SELECT * FROM goal_targets WHERE goal_id = $1", [g.id]);
      const target = targetRes.rows[0] || null;

      const milestones = (await pool.query(
        "SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY sequence_order ASC",
        [g.id]
      )).rows;

      const measurements = (await pool.query(
        "SELECT * FROM goal_measurements WHERE goal_id = $1 ORDER BY recorded_date ASC",
        [g.id]
      )).rows;

      let progressData = null;
      if (target) {
        progressData = calculateGoalProgress(
          target.starting_value,
          target.current_value,
          target.target_value,
          target.direction
        );
      }

      fullGoals.push({
        ...g,
        target,
        progress: progressData,
        milestones,
        measurements
      });
    }

    return fullGoals;
  },

  async getGoalById(goalId) {
    const gRes = await pool.query(
      `SELECT g.*, gt.name as goal_type_name, gt.target_direction, gt.default_unit,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name,
              c.first_name as client_first_name, c.last_name as client_last_name, c.client_code
       FROM wellness_goals g
       LEFT JOIN goal_types gt ON g.goal_type_id = gt.id
       LEFT JOIN practitioners p ON g.practitioner_id = p.id
       JOIN clients c ON g.client_id = c.id
       WHERE g.id = $1`,
      [goalId]
    );

    if (gRes.rowCount === 0) {
      throw new Error("Goal not found");
    }
    const goal = gRes.rows[0];

    const targetRes = await pool.query("SELECT * FROM goal_targets WHERE goal_id = $1", [goalId]);
    const target = targetRes.rows[0] || null;

    const milestones = (await pool.query(
      "SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY sequence_order ASC",
      [goalId]
    )).rows;

    const measurements = (await pool.query(
      `SELECT gm.*, u.first_name as recorded_by_name
       FROM goal_measurements gm
       LEFT JOIN users u ON gm.recorded_by = u.id
       WHERE gm.goal_id = $1
       ORDER BY gm.recorded_date ASC`,
      [goalId]
    )).rows;

    let progressData = null;
    if (target) {
      progressData = calculateGoalProgress(
        target.starting_value,
        target.current_value,
        target.target_value,
        target.direction
      );
    }

    return {
      ...goal,
      target,
      progress: progressData,
      milestones,
      measurements
    };
  },

  async createGoal({
    clientId,
    organizationId = 1,
    practitionerId = null,
    branchId = 1,
    goalTypeId,
    goalName,
    description = "",
    priority = "MEDIUM",
    startDate,
    targetDate,
    metricName,
    startingValue,
    targetValue,
    unit,
    direction = "DECREASE",
    valueType = "DECIMAL",
    milestones = [],
    userId = null
  }) {
    // Validate targetDate >= startDate
    if (new Date(targetDate) < new Date(startDate)) {
      throw new Error("Target date cannot be earlier than start date");
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const gRes = await conn.query(
        `INSERT INTO wellness_goals (
          organization_id, client_id, practitioner_id, branch_id, goal_type_id, goal_name,
          description, priority, start_date, target_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
        RETURNING *`,
        [
          organizationId,
          clientId,
          practitionerId,
          branchId,
          goalTypeId || null,
          goalName,
          description,
          priority,
          startDate,
          targetDate
        ]
      );
      const newGoal = gRes.rows[0];

      // Insert target
      const tRes = await conn.query(
        `INSERT INTO goal_targets (
          goal_id, metric_name, starting_value, current_value, target_value, unit, direction, value_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          newGoal.id,
          metricName || "Metric",
          startingValue,
          startingValue, // initial current = starting
          targetValue,
          unit || "units",
          direction,
          valueType
        ]
      );
      const newTarget = tRes.rows[0];

      // Initial measurement (baseline)
      await conn.query(
        `INSERT INTO goal_measurements (goal_id, recorded_date, recorded_value, notes, recorded_by)
         VALUES ($1, $2, $3, 'Initial baseline measurement', $4)`,
        [newGoal.id, startDate, startingValue, userId]
      );

      // Create milestones if provided, or generate 4 auto-milestones
      if (milestones && milestones.length > 0) {
        for (let i = 0; i < milestones.length; i++) {
          const m = milestones[i];
          await conn.query(
            `INSERT INTO goal_milestones (goal_id, sequence_order, target_value, target_date, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newGoal.id, i + 1, m.targetValue, m.targetDate || null, m.status || (i === 0 ? "ACTIVE" : "PENDING"), m.notes || null]
          );
        }
      } else {
        // Auto generate 4 progressive milestones between starting and target
        const start = parseFloat(startingValue);
        const tgt = parseFloat(targetValue);
        const step = (tgt - start) / 4;
        for (let i = 1; i <= 4; i++) {
          const val = Math.round((start + step * i) * 10) / 10;
          await conn.query(
            `INSERT INTO goal_milestones (goal_id, sequence_order, target_value, status, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [newGoal.id, i, val, i === 1 ? "ACTIVE" : "PENDING", `Milestone ${i} checkpoint`]
          );
        }
      }

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "GOAL_CREATED",
        module: "GOALS",
        entityType: "wellness_goals",
        entityId: newGoal.id,
        newData: { goalName, startingValue, targetValue, unit, direction }
      });

      return await this.getGoalById(newGoal.id);
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async recordMeasurement(goalId, { recordedDate, recordedValue, notes = "", userId = null }) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // 1. Insert historical measurement (Never overwrite!)
      const mRes = await conn.query(
        `INSERT INTO goal_measurements (goal_id, recorded_date, recorded_value, notes, recorded_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [goalId, recordedDate, recordedValue, notes, userId]
      );
      const newMeasurement = mRes.rows[0];

      // 2. Update target's current_value
      await conn.query(
        `UPDATE goal_targets
         SET current_value = $1, updated_at = CURRENT_TIMESTAMP
         WHERE goal_id = $2`,
        [recordedValue, goalId]
      );

      // 3. Get target to recheck milestone achievement and goal status
      const targetRes = await conn.query("SELECT * FROM goal_targets WHERE goal_id = $1", [goalId]);
      const target = targetRes.rows[0];

      const val = parseFloat(recordedValue);
      const dir = (target.direction || "DECREASE").toUpperCase();

      // Check milestones
      const milestones = (await conn.query("SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY sequence_order ASC", [goalId])).rows;
      for (const m of milestones) {
        const mTarget = parseFloat(m.target_value);
        let achieved = false;
        if (dir === "DECREASE" && val <= mTarget) {
          achieved = true;
        } else if (dir === "INCREASE" && val >= mTarget) {
          achieved = true;
        }

        if (achieved && m.status !== "ACHIEVED") {
          await conn.query(
            `UPDATE goal_milestones
             SET status = 'ACHIEVED', achieved_date = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [recordedDate, m.id]
          );
        }
      }

      // Check if goal fully achieved
      const progress = calculateGoalProgress(target.starting_value, val, target.target_value, dir);
      if (progress.isAchieved) {
        await conn.query(
          "UPDATE wellness_goals SET status = 'ACHIEVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [goalId]
        );
      }

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "GOAL_MEASUREMENT_RECORDED",
        module: "GOALS",
        entityType: "goal_measurements",
        entityId: newMeasurement.id,
        newData: { recordedValue, recordedDate, notes }
      });

      return await this.getGoalById(goalId);
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateMilestone(milestoneId, { status, achievedDate, notes, userId = null }) {
    const res = await pool.query(
      `UPDATE goal_milestones
       SET status = COALESCE($1, status),
           achieved_date = COALESCE($2, achieved_date),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, achievedDate, notes, milestoneId]
    );
    return res.rows[0];
  }
};
