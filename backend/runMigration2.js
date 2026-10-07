import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Running Migration 002_saas_features.sql...");
  const sqlPath = path.join(__dirname, "src", "migrations", "002_saas_features.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration 002_saas_features.sql applied successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
