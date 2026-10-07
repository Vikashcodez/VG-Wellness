import { orderService } from "../services/orderService.js";
import pool from "../config/db.js";

export const checkout = async (req, res, next) => {
  try {
    const clientId = req.user.clientId || parseInt(req.body.clientId);
    const { shippingAddress, paymentMethod, branchId, notes } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client ID required" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    const result = await orderService.checkoutOrder(clientId, {
      shippingAddress,
      paymentMethod: paymentMethod || "UPI",
      branchId: branchId || 1,
      notes
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    const orders = await orderService.getOrders({
      clientId: clientId ? parseInt(clientId) : null,
      branchId: req.query.branchId ? parseInt(req.query.branchId) : null,
      status: req.query.status
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await orderService.getOrderById(orderId);

    if (req.user.role === "CLIENT" && order.client_id !== req.user.clientId) {
      return res.status(403).json({ success: false, message: "Access forbidden" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes } = req.body;

    const updated = (await pool.query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, orderId]
    )).rows[0];

    await pool.query(
      "INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES ($1, $2, $3, $4)",
      [orderId, status, notes || `Status changed to ${status}`, req.user.id]
    );

    res.json({ success: true, message: `Order status updated to ${status}`, data: updated });
  } catch (error) {
    next(error);
  }
};
