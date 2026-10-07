import pool from "../config/db.js";

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.clientId;

    let query = "SELECT * FROM notifications WHERE user_id = $1";
    const params = [userId];

    if (clientId) {
      query = "SELECT * FROM notifications WHERE user_id = $1 OR client_id = $2";
      params.push(clientId);
    }

    query += " ORDER BY created_at DESC LIMIT 50";
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query("UPDATE notifications SET is_read = true WHERE id = $1", [id]);
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};
