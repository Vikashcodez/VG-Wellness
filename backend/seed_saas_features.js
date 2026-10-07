import bcrypt from "bcryptjs";
import pool from "./src/config/db.js";

async function seedSaaSFeatures() {
  console.log("Seeding SaaS Multi-Tenant Data, Employees, Assets, and Finance...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create or ensure roles
    const roleRes = await client.query("SELECT id, name FROM roles");
    const roleMap = {};
    roleRes.rows.forEach(r => { roleMap[r.name] = r.id; });

    // 2. Tenant 2: Prana Health & Ayurveda Retreat
    const tenant2Res = await client.query(
      `INSERT INTO organizations (name, code, slug, email, phone, address, website, plan_type, status, max_branches, tax_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, plan_type = EXCLUDED.plan_type
       RETURNING id`,
      [
        "Prana Health & Ayurveda Retreat",
        "PRANA-RETREAT",
        "prana-retreat",
        "contact@pranaretreat.com",
        "+91 83 2278 9900",
        "Candolim Beach Road, North Goa, Goa 403515",
        "https://pranaretreat.com",
        "PRO",
        "ACTIVE",
        3,
        "GSTIN-30AABCP4412Q1ZL"
      ]
    );
    const pranaOrgId = tenant2Res.rows[0].id;

    // Prana Branch 1
    const pranaBranchRes = await client.query(
      `INSERT INTO branches (organization_id, name, code, email, phone, address, city, state, country, pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        pranaOrgId,
        "Prana Candolim Beach Wellness Centre",
        "PRANA-CDL-01",
        "candolim@pranaretreat.com",
        "+91 83 2278 9901",
        "Plot 45, Coastal Highway, Candolim",
        "Candolim",
        "Goa",
        "India",
        "403515"
      ]
    );
    const pranaBranchId = pranaBranchRes.rows[0].id;

    // Prana Centre Admin User
    const salt = await bcrypt.genSalt(10);
    const pwHash = await bcrypt.hash("admin123", salt);

    const pranaAdminRes = await client.query(
      `INSERT INTO users (branch_id, role_id, email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [
        pranaBranchId,
        roleMap["CENTRE_ADMIN"] || roleMap["ADMIN"],
        "prana.admin@wellness.com",
        pwHash,
        "Devika",
        "Menon",
        "+91 98221 44556"
      ]
    );
    const pranaAdminId = pranaAdminRes.rows[0].id;

    await client.query("UPDATE organizations SET admin_user_id = $1 WHERE id = $2", [pranaAdminId, pranaOrgId]);
    await client.query("UPDATE branches SET branch_admin_id = $1 WHERE id = $2", [pranaAdminId, pranaBranchId]);

    // Also link Tenant 1 Admin
    const auraAdminRes = await client.query("SELECT id FROM users WHERE email = 'admin@wellness.com'");
    if (auraAdminRes.rows[0]) {
      await client.query("UPDATE organizations SET admin_user_id = $1 WHERE code = 'AURA-LIFE'", [auraAdminRes.rows[0].id]);
    }
    const mgrRes = await client.query("SELECT id FROM users WHERE email = 'manager@wellness.com'");
    if (mgrRes.rows[0]) {
      await client.query("UPDATE branches SET branch_admin_id = $1 WHERE code = 'AURA-BLR-01'", [mgrRes.rows[0].id]);
    }

    // 3. Seed Employees Master for Aura Life (Org 1)
    const org1Res = await client.query("SELECT id FROM organizations WHERE code = 'AURA-LIFE'");
    const org1Id = org1Res.rows[0].id;

    const employees = [
      {
        code: "EMP-001",
        firstName: "Dr. Ananya",
        lastName: "Iyer",
        email: "doctor@wellness.com",
        phone: "+91 98450 11223",
        dept: "CLINICAL",
        desig: "Chief Naturopathic Physician",
        salary: 120000,
        status: "ACTIVE"
      },
      {
        code: "EMP-002",
        firstName: "Priya",
        lastName: "Nair",
        email: "priya.nair@wellness.com",
        phone: "+91 98450 22334",
        dept: "THERAPY",
        desig: "Senior Nutritionist & Dietitian",
        salary: 75000,
        status: "ACTIVE"
      },
      {
        code: "EMP-003",
        firstName: "Vikram",
        lastName: "Singhania",
        email: "manager@wellness.com",
        phone: "+91 98450 33445",
        dept: "MANAGEMENT",
        desig: "Centre Operations Manager",
        salary: 95000,
        status: "ACTIVE"
      },
      {
        code: "EMP-004",
        firstName: "Meera",
        lastName: "Patel",
        email: "reception@wellness.com",
        phone: "+91 98450 44556",
        dept: "FRONT_OFFICE",
        desig: "Lead Front Desk Receptionist",
        salary: 42000,
        status: "ACTIVE"
      },
      {
        code: "EMP-005",
        firstName: "Rohan",
        lastName: "Deshmukh",
        email: "rohan.accounts@wellness.com",
        phone: "+91 98450 55667",
        dept: "ACCOUNTS",
        desig: "Senior Accounts & Billing Officer",
        salary: 58000,
        status: "ACTIVE"
      },
      {
        code: "EMP-006",
        firstName: "Suresh",
        lastName: "Kumar",
        email: "suresh.therapist@wellness.com",
        phone: "+91 98450 66778",
        dept: "THERAPY",
        desig: "Certified Ayurvedic Panchakarma Therapist",
        salary: 48000,
        status: "ACTIVE"
      }
    ];

    for (const emp of employees) {
      await client.query(
        `INSERT INTO employees (organization_id, branch_id, employee_code, first_name, last_name, email, phone, department, designation, salary, status)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (employee_code) DO UPDATE SET 
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           salary = EXCLUDED.salary,
           department = EXCLUDED.department,
           designation = EXCLUDED.designation`,
        [org1Id, emp.code, emp.firstName, emp.lastName, emp.email, emp.phone, emp.dept, emp.desig, emp.salary, emp.status]
      );
    }

    // 4. Seed Assets Management Master
    const assets = [
      {
        code: "AST-AURA-001",
        name: "Bio-Impedance Segmental Body Composition Analyzer",
        category: "DIAGNOSTIC",
        serial: "BIA-PRO-9842",
        cost: 350000,
        currVal: 310000,
        room: "Consultation Suite 1",
        status: "OPERATIONAL",
        vendor: "InBody India Pvt Ltd",
        warranty: "2028-06-30",
        nextService: "2026-12-15"
      },
      {
        code: "AST-AURA-002",
        name: "Solid Teakwood Shirodhara Massage Table & Brass Stand",
        category: "THERAPY_EQUIPMENT",
        serial: "AYUR-SHIRO-014",
        cost: 85000,
        currVal: 80000,
        room: "Ayurveda Chamber 2",
        status: "OPERATIONAL",
        vendor: "Kerala Ayurveda Crafts",
        warranty: "2030-01-01",
        nextService: "2026-11-20"
      },
      {
        code: "AST-AURA-003",
        name: "Full Spectrum Infrared Detox Sauna Pod (Double Seat)",
        category: "WELLNESS_MACHINE",
        serial: "SAUNA-IR-7721",
        cost: 420000,
        currVal: 385000,
        room: "Hydro & Detox Suite",
        status: "OPERATIONAL",
        vendor: "Nordic Wellness Tech",
        warranty: "2027-10-15",
        nextService: "2026-10-30"
      },
      {
        code: "AST-AURA-004",
        name: "Hydraulic Electric Multi-Position Physiotherapy Bed",
        category: "THERAPY_EQUIPMENT",
        serial: "PHYSIO-BED-330",
        cost: 115000,
        currVal: 105000,
        room: "Physiotherapy Room 1",
        status: "OPERATIONAL",
        vendor: "MediHealth Ergonomics",
        warranty: "2027-05-12",
        nextService: "2026-11-05"
      },
      {
        code: "AST-AURA-005",
        name: "Dell OptiPlex All-In-One Reception Terminal (x2)",
        category: "IT_HARDWARE",
        serial: "DELL-OPT-9021",
        cost: 140000,
        currVal: 110000,
        room: "Front Desk & Billing",
        status: "OPERATIONAL",
        vendor: "Dell India Solutions",
        warranty: "2027-03-31",
        nextService: "2027-01-10"
      },
      {
        code: "AST-AURA-006",
        name: "Cold-Press Commercial Herbal Juice Extractor",
        category: "FACILITY",
        serial: "JUICE-PRO-108",
        cost: 65000,
        currVal: 55000,
        room: "Wellness Herb & Tea Bar",
        status: "UNDER_MAINTENANCE",
        vendor: "Kuvings Commercial",
        warranty: "2026-12-31",
        nextService: "2026-10-15"
      }
    ];

    for (const ast of assets) {
      const astRes = await client.query(
        `INSERT INTO assets (
           organization_id, branch_id, asset_code, name, category, serial_number,
           purchase_cost, current_value, location_room, status, vendor_name, warranty_expiry, next_service_date
         ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (asset_code) DO UPDATE SET 
           current_value = EXCLUDED.current_value,
           status = EXCLUDED.status,
           next_service_date = EXCLUDED.next_service_date
         RETURNING id`,
        [org1Id, ast.code, ast.name, ast.category, ast.serial, ast.cost, ast.currVal, ast.room, ast.status, ast.vendor, ast.warranty, ast.nextService]
      );

      // Log sample maintenance
      if (astRes.rows[0]) {
        await client.query(
          `INSERT INTO asset_maintenance_logs (asset_id, service_date, maintenance_type, cost, performed_by, notes)
           VALUES ($1, CURRENT_DATE - INTERVAL '30 days', 'CALIBRATION', 3500.00, 'Authorized Tech Services', 'Routine sensor alignment and calibration passed')`,
          [astRes.rows[0].id]
        );
      }
    }

    // 5. Seed Accounts & Finance (Expense Categories & Expenses)
    const expCategories = [
      { name: "Staff Payroll & Wages", desc: "Monthly salaries and practitioner fees" },
      { name: "Facility Lease & Rent", desc: "Branch property rental and maintenance" },
      { name: "Clinical & Therapy Supplies", desc: "Herbal oils, disposable sheets, acupuncture needles" },
      { name: "Electricity, Water & Utilities", desc: "Power, high-speed internet, steam water" },
      { name: "Equipment Maintenance", desc: "Calibration, servicing, and replacement parts" },
      { name: "Marketing & Brand Promotion", desc: "Social media, flyers, corporate wellness outreach" }
    ];

    const catMap = {};
    for (const cat of expCategories) {
      const res = await client.query(
        `INSERT INTO expense_categories (organization_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, name`,
        [org1Id, cat.name, cat.desc]
      );
      catMap[cat.name] = res.rows[0].id;
    }

    const expenses = [
      {
        code: "EXP-2026-001",
        cat: "Facility Lease & Rent",
        title: "Monthly Rent - Indiranagar Flagship Centre",
        amount: 145000.00,
        tax: 26100.00,
        date: "2026-10-01",
        method: "BANK_TRANSFER",
        payee: "Indiranagar Commercial Properties Ltd",
        ref: "NEFT-HDFC-991048",
        notes: "October 2026 ground & first floor lease"
      },
      {
        code: "EXP-2026-002",
        cat: "Clinical & Therapy Supplies",
        title: "Organic Sesame & Mahanarayan Oils Bulk Shipment",
        amount: 28500.00,
        tax: 5130.00,
        date: "2026-10-03",
        method: "UPI",
        payee: "Kottakkal Arya Vaidya Sala Dist.",
        ref: "UPI-409188299102",
        notes: "50 Litres organic medicated massage oil"
      },
      {
        code: "EXP-2026-003",
        cat: "Electricity, Water & Utilities",
        title: "BESCOM Commercial Power Bill",
        amount: 22450.00,
        tax: 0.00,
        date: "2026-10-04",
        method: "BANK_TRANSFER",
        payee: "BESCOM Karnataka",
        ref: "BILL-OCT-BESCOM-441",
        notes: "Sauna and steam unit high-load consumption"
      },
      {
        code: "EXP-2026-004",
        cat: "Marketing & Brand Promotion",
        title: "Google & Meta Local Corporate Wellness Campaign",
        amount: 18000.00,
        tax: 3240.00,
        date: "2026-10-05",
        method: "CREDIT_CARD",
        payee: "Google Ads India",
        ref: "CC-VISA-8812",
        notes: "Corporate executive burnout reduction promo"
      }
    ];

    for (const exp of expenses) {
      await client.query(
        `INSERT INTO expenses (organization_id, branch_id, expense_code, category_id, title, amount, tax_amount, payment_date, payment_method, vendor_payee, reference_number, notes)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (expense_code) DO NOTHING`,
        [org1Id, exp.code, catMap[exp.cat], exp.title, exp.amount, exp.tax, exp.date, exp.method, exp.payee, exp.ref, exp.notes]
      );
    }

    await client.query("COMMIT");
    console.log("✅ SaaS Data, Multi-Tenants, Employees, Assets, and Finance seeded successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding SaaS features failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSaaSFeatures();
