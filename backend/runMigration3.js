import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration3() {
  const filePath = path.join(__dirname, "src", "migrations", "003_tenant_isolation_org_branch_ids.sql");
  console.log("Applying Migration 003: Tenant Isolation (organization_id & branch_id)...");
  const sql = fs.readFileSync(filePath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Migration 003 applied successfully! All tables now have organization_id & branch_id.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration 003 failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration3();
