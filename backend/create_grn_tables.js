import pool from "./src/config/db.js";

async function createGrnTables() {
  console.log("Creating GRN tables...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goods_receipt_notes (
      id SERIAL PRIMARY KEY,
      organization_id INT REFERENCES organizations(id),
      branch_id INT REFERENCES branches(id),
      grn_number VARCHAR(100) UNIQUE NOT NULL,
      supplier_id INT REFERENCES suppliers(id),
      invoice_number VARCHAR(100),
      invoice_date DATE,
      received_date DATE DEFAULT CURRENT_DATE,
      total_amount NUMERIC(12, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'RECEIVED',
      notes TEXT,
      created_by INT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grn_items (
      id SERIAL PRIMARY KEY,
      grn_id INT REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id),
      batch_number VARCHAR(100) NOT NULL,
      expiry_date DATE,
      quantity INT NOT NULL,
      unit_cost NUMERIC(10, 2) NOT NULL,
      mrp NUMERIC(10, 2) NOT NULL,
      total_cost NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("GRN tables created successfully!");
  process.exit(0);
}

createGrnTables().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
