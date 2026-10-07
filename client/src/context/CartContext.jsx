import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";
import { useClientAuth } from "./ClientAuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useClientAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const res = await api.get("/cart");
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const res = await api.post("/cart/items", { productId, quantity });
      if (res.data.success) {
        setCart(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setLoading(true);
    try {
      const res = await api.put("/cart/items", { productId, quantity });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, fetchCart, addToCart, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
