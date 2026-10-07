import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Test DB connection before listening
pool.query("SELECT NOW()")
  .then((res) => {
    console.log(`Connected to PostgreSQL database at ${res.rows[0].now}`);
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Wellness Centre Management API Server Running!`);
      console.log(` Port: ${PORT}`);
      console.log(` URL:  http://localhost:${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error("FATAL: Failed to connect to PostgreSQL:", err);
    process.exit(1);
  });
