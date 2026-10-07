import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log("Running PostgreSQL database migrations...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sqlPath = path.join(__dirname, "001_initial_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migrations executed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
