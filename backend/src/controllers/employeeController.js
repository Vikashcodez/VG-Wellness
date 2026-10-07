import { employeeService } from "../services/employeeService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getEmployees = async (req, res, next) => {
  try {
    const { department, status, search } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    const employees = await employeeService.getEmployees({
      department,
      status,
      branchId,
      organizationId,
      search
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(parseInt(req.params.id));
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const employee = await employeeService.createEmployee({
      ...req.body,
      organizationId: req.body.organizationId || organizationId,
      branchId: req.body.branchId || branchId || 1
    }, req.user.id);
    res.status(201).json({ success: true, message: "Employee registered successfully", data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, message: "Employee updated successfully", data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmployeePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const result = await employeeService.updatePermissions(parseInt(req.params.id), permissions, req.user.id);
    res.json({ success: true, message: "Module tab permissions updated successfully", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.deleteEmployee(parseInt(req.params.id), req.user.id);
    res.json({ success: true, message: "Employee deactivated", data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
