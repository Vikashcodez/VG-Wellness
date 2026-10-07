import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const getAssessments = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    const assessments = (await pool.query(
      `SELECT a.*, p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM wellness_assessments a
       LEFT JOIN practitioners p ON a.practitioner_id = p.id
       WHERE a.client_id = $1
       ORDER BY a.assessment_date DESC, a.created_at DESC`,
      [parseInt(clientId)]
    )).rows;

    res.json({ success: true, data: assessments });
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const {
      clientId, branchId, appointmentId, assessmentDate,
      weight, height, bodyFatPct, muscleMassKg, waistCircumferenceCm,
      waterIntakeL, sleepHours, exerciseFreqWeekly, stressLevel,
      lifestyleNotes, nutritionNotes, clinicalNotes, metrics
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    // Auto-calculate BMI if weight and height are provided
    let calculatedBmi = null;
    if (weight && height) {
      const hM = parseFloat(height) / 100;
      calculatedBmi = Math.round((parseFloat(weight) / (hM * hM)) * 100) / 100;
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const insertRes = await conn.query(
        `INSERT INTO wellness_assessments (
          client_id, branch_id, practitioner_id, appointment_id, assessment_date,
          weight, height, bmi, body_fat_pct, muscle_mass_kg, waist_circumference_cm,
          water_intake_l, sleep_hours, exercise_freq_weekly, stress_level,
          lifestyle_notes, nutrition_notes, clinical_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          clientId,
          branchId || req.user.branchId || 1,
          req.user.practitionerId || null,
          appointmentId || null,
          assessmentDate || new Date().toISOString().split("T")[0],
          weight || null,
          height || null,
          calculatedBmi,
          bodyFatPct || null,
          muscleMassKg || null,
          waistCircumferenceCm || null,
          waterIntakeL || null,
          sleepHours || null,
          exerciseFreqWeekly || null,
          stressLevel || "MODERATE",
          lifestyleNotes || null,
          nutritionNotes || null,
          clinicalNotes || null
        ]
      );
      const newAssessment = insertRes.rows[0];

      if (metrics && Array.isArray(metrics)) {
        for (const m of metrics) {
          if (m.name && m.value !== undefined) {
            await conn.query(
              `INSERT INTO wellness_assessment_metrics (assessment_id, metric_name, metric_value, unit, notes)
               VALUES ($1, $2, $3, $4, $5)`,
              [newAssessment.id, m.name, m.value, m.unit || null, m.notes || null]
            );
          }
        }
      }

      await conn.query("COMMIT");

      logAudit({
        userId: req.user.id,
        action: "ASSESSMENT_RECORDED",
        module: "ASSESSMENTS",
        entityType: "wellness_assessments",
        entityId: newAssessment.id,
        newData: { clientId, weight, bmi: calculatedBmi }
      });

      res.status(201).json({ success: true, message: "Assessment recorded", data: newAssessment });
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};
