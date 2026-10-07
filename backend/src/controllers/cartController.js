import { orderService } from "../services/orderService.js";

export const getCart = async (req, res, next) => {
  try {
    let clientId = req.user.clientId;
    if (!clientId && req.query.clientId) {
      clientId = parseInt(req.query.clientId);
    }
    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client ID required" });
    }

    const cart = await orderService.getCart(clientId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    let clientId = req.user.clientId;
    if (!clientId && req.body.clientId) {
      clientId = parseInt(req.body.clientId);
    }

    if (!clientId || !productId) {
      return res.status(400).json({ success: false, message: "clientId and productId are required" });
    }

    const cart = await orderService.addToCart(clientId, parseInt(productId), quantity ? parseInt(quantity) : 1);
    res.json({ success: true, message: "Product added to cart", data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const clientId = req.user.clientId || parseInt(req.body.clientId);

    const cart = await orderService.updateCartItem(clientId, parseInt(productId), parseInt(quantity));
    res.json({ success: true, message: "Cart updated", data: cart });
  } catch (error) {
    next(error);
  }
};
