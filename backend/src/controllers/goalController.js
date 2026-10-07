import { goalService } from "../services/goalService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getGoalMeta = async (req, res, next) => {
  try {
    const meta = await goalService.getGoalCategoriesAndTypes();
    res.json({ success: true, data: meta });
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    const goals = await goalService.getClientGoals(parseInt(clientId), scope.organizationId);
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const goalId = parseInt(req.params.id);
    const goal = await goalService.getGoalById(goalId);

    // If client, ensure ownership
    if (req.user.role === "CLIENT" && goal.client_id !== req.user.clientId) {
      return res.status(403).json({ success: false, message: "Access forbidden to this goal" });
    }
    if (!scope.isSuper && goal.organization_id && goal.organization_id !== scope.organizationId) {
      return res.status(403).json({ success: false, message: "Access forbidden: Goal belongs to another wellness centre" });
    }

    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let clientId = req.body.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    const {
      goalName, startDate, targetDate, metricName, startingValue, targetValue,
      unit, direction, valueType, practitionerId, description, priority, milestones, goalTypeId
    } = req.body;

    if (!clientId || !goalName || !startDate || !targetDate || startingValue === undefined || targetValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "clientId, goalName, startDate, targetDate, startingValue, and targetValue are required"
      });
    }

    const targetBranchId = scope.branchId || (req.body.branchId ? parseInt(req.body.branchId) : 1);
    const targetOrgId = scope.organizationId || 1;

    const goal = await goalService.createGoal({
      clientId,
      organizationId: targetOrgId,
      practitionerId: practitionerId || req.user.practitionerId || null,
      branchId: targetBranchId,
      goalTypeId,
      goalName,
      description,
      priority,
      startDate,
      targetDate,
      metricName,
      startingValue,
      targetValue,
      unit,
      direction,
      valueType,
      milestones,
      userId: req.user.id
    });

    res.status(201).json({ success: true, message: "Goal created successfully", data: goal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const recordMeasurement = async (req, res, next) => {
  try {
    const goalId = parseInt(req.params.id);
    const { recordedDate, recordedValue, notes } = req.body;

    if (!recordedDate || recordedValue === undefined) {
      return res.status(400).json({ success: false, message: "recordedDate and recordedValue are required" });
    }

    const updatedGoal = await goalService.recordMeasurement(goalId, {
      recordedDate,
      recordedValue,
      notes,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: "Measurement recorded successfully",
      data: updatedGoal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const milestoneId = parseInt(req.params.milestoneId);
    const { status, achievedDate, notes } = req.body;

    const updated = await goalService.updateMilestone(milestoneId, {
      status,
      achievedDate,
      notes,
      userId: req.user.id
    });

    res.json({ success: true, message: "Milestone updated", data: updated });
  } catch (error) {
    next(error);
  }
};
