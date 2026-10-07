import { authService } from "../services/authService.js";
import pool from "../config/db.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const result = await authService.login(email, password, req.ip);
    res.json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const registerClient = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, mobile, dateOfBirth, gender, branchId, address, city, state, pincode } = req.body;
    if (!firstName || !lastName || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, password and mobile are required"
      });
    }

    const result = await authService.registerClient({
      firstName,
      lastName,
      email,
      password,
      mobile,
      dateOfBirth,
      gender,
      branchId: branchId || 1,
      address,
      city,
      state,
      pincode,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: "Client registration successful",
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.branch_id,
              b.name as branch_name, r.name as role, c.id as client_id, c.client_code,
              p.id as practitioner_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       LEFT JOIN clients c ON c.user_id = u.id
       LEFT JOIN practitioners p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRes.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branch_id,
        branchName: user.branch_name,
        clientId: user.client_id,
        clientCode: user.client_code,
        practitionerId: user.practitioner_id
      }
    });
  } catch (error) {
    next(error);
  }
};
