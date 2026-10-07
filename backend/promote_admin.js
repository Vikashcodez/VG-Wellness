import pool from "./src/config/db.js";

async function promote() {
  const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
  const superRoleId = roleRes.rows[0].id;
  await pool.query("UPDATE users SET role_id = $1 WHERE email = 'admin@wellness.com'", [superRoleId]);
  console.log("admin@wellness.com is now SUPER_ADMIN!");
  await pool.end();
}

promote();
