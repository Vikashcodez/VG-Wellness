import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import practitionerRoutes from "./routes/practitionerRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import wellnessPlanRoutes from "./routes/wellnessPlanRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Wellness Centre Management System API"
  });
});

// Mount modular REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/practitioners", practitionerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/wellness-plans", wellnessPlanRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
