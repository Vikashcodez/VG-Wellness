import pool from "./src/config/db.js";

async function check() {
  const tables = ['services', 'packages', 'membership_plans', 'products', 'suppliers', 'inventory_stock', 'inventory_transactions'];
  for (const t of tables) {
    const c = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
    console.log(`\n=== ${t.toUpperCase()} ===`);
    c.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
  }
  process.exit(0);
}

check().catch(console.error);
