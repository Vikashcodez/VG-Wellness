import pool from "./src/config/db.js";

async function verifyAndUpdate() {
  console.log("Checking and synchronizing organization_id and branch_id across database...");

  // 1. Ensure users have organization_id synced from branches
  const uRes = await pool.query(`
    UPDATE users u 
    SET organization_id = b.organization_id 
    FROM branches b 
    WHERE u.branch_id = b.id AND (u.organization_id IS NULL OR u.organization_id != b.organization_id);
  `);
  console.log(`Updated users with branch organization_id: ${uRes.rowCount}`);

  // Fallback remaining users to 1
  const uFallback = await pool.query(`UPDATE users SET organization_id = 1 WHERE organization_id IS NULL;`);
  console.log(`Fallback users organization_id: ${uFallback.rowCount}`);

  // 2. Ensure all employees have organization_id
  const empRes = await pool.query(`
    UPDATE employees e
    SET organization_id = b.organization_id
    FROM branches b
    WHERE e.branch_id = b.id AND (e.organization_id IS NULL OR e.organization_id != b.organization_id);
  `);
  console.log(`Updated employees with branch organization_id: ${empRes.rowCount}`);

  // Fallback remaining employees to 1
  const empFallback = await pool.query(`UPDATE employees SET organization_id = 1 WHERE organization_id IS NULL;`);
  console.log(`Fallback employees organization_id: ${empFallback.rowCount}`);

  // 3. Inspect organizations and branches count
  const orgs = await pool.query("SELECT id, name, code FROM organizations ORDER BY id ASC");
  console.log("\nOrganizations:");
  console.table(orgs.rows);

  const branches = await pool.query("SELECT id, organization_id, name, code FROM branches ORDER BY id ASC");
  console.log("\nBranches:");
  console.table(branches.rows);

  // 4. Inspect table row counts and organization_id distributions
  const tables = [
    "clients", "practitioners", "services", "packages", "membership_plans",
    "products", "inventory_stock", "appointments", "wellness_goals",
    "wellness_assessments", "invoices", "payments", "orders", "employees", "assets"
  ];

  console.log("\nEntity counts by organization_id:");
  for (const t of tables) {
    try {
      const counts = await pool.query(`SELECT organization_id, count(*) as count FROM ${t} GROUP BY organization_id ORDER BY organization_id ASC`);
      console.log(`Table ${t}:`, counts.rows);
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }

  await pool.end();
}

verifyAndUpdate().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
