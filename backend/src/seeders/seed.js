import bcrypt from "bcryptjs";
import pool from "../config/db.js";

async function seed() {
  console.log("Seeding Wellness Centre database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Roles
    const roles = [
      { name: "SUPER_ADMIN", description: "System Super Administrator", is_system: true },
      { name: "ADMIN", description: "Wellness Centre Administrator", is_system: true },
      { name: "MANAGER", description: "Branch / Operations Manager", is_system: true },
      { name: "RECEPTIONIST", description: "Front Desk & Reception Staff", is_system: true },
      { name: "PRACTITIONER", description: "Wellness Doctor / Physician", is_system: true },
      { name: "NUTRITIONIST", description: "Diet & Nutrition Consultant", is_system: true },
      { name: "THERAPIST", description: "Yoga & Massage Therapist", is_system: true },
      { name: "BILLING_STAFF", description: "Accounts & Billing Specialist", is_system: true },
      { name: "INVENTORY_STAFF", description: "Store & Inventory Manager", is_system: true },
      { name: "CLIENT", description: "Wellness Centre Client", is_system: true }
    ];

    const roleMap = {};
    for (const r of roles) {
      const res = await client.query(
        `INSERT INTO roles (name, description, is_system)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [r.name, r.description, r.is_system]
      );
      roleMap[r.name] = res.rows[0].id;
    }

    // 2. Organization
    const orgRes = await client.query(
      `INSERT INTO organizations (name, code, email, phone, address, website)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        "Aura Life Wellness Group",
        "AURA-LIFE",
        "contact@auralifewellness.com",
        "+91 80 4123 4567",
        "100 Feet Road, Indiranagar, Bengaluru, Karnataka",
        "https://auralifewellness.com"
      ]
    );
    const orgId = orgRes.rows[0].id;

    // 3. Branches
    const branchRes1 = await client.query(
      `INSERT INTO branches (organization_id, name, code, email, phone, address, city, state, country, pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        orgId,
        "Aura Life Flagship Centre",
        "BLR-IND-01",
        "indiranagar@auralifewellness.com",
        "+91 80 4123 4568",
        "12th Main, Indiranagar",
        "Bengaluru",
        "Karnataka",
        "India",
        "560038"
      ]
    );
    const branch1Id = branchRes1.rows[0].id;

    const branchRes2 = await client.query(
      `INSERT INTO branches (organization_id, name, code, email, phone, address, city, state, country, pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        orgId,
        "Aura Life Serenity Retreat",
        "MUM-BAN-01",
        "bandra@auralifewellness.com",
        "+91 22 2640 1234",
        "Pali Hill, Bandra West",
        "Mumbai",
        "Maharashtra",
        "India",
        "400050"
      ]
    );
    const branch2Id = branchRes2.rows[0].id;

    // 4. Staff Users
    const defaultPassword = "password123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(defaultPassword, salt);
    const adminHash = await bcrypt.hash("admin123", salt);
    const clientHash = await bcrypt.hash("client123", salt);

    const usersToCreate = [
      {
        email: "admin@wellness.com",
        password_hash: adminHash,
        first_name: "Super",
        last_name: "Admin",
        phone: "+91 99000 11100",
        role: "ADMIN"
      },
      {
        email: "reception@wellness.com",
        password_hash: hash,
        first_name: "Meera",
        last_name: "Nair",
        phone: "+91 99000 11101",
        role: "RECEPTIONIST"
      },
      {
        email: "dr.sharma@wellness.com",
        password_hash: hash,
        first_name: "Dr. Ananya",
        last_name: "Sharma",
        phone: "+91 99000 11102",
        role: "PRACTITIONER"
      },
      {
        email: "nutritionist@wellness.com",
        password_hash: hash,
        first_name: "Priya",
        last_name: "Patel",
        phone: "+91 99000 11103",
        role: "NUTRITIONIST"
      },
      {
        email: "therapist@wellness.com",
        password_hash: hash,
        first_name: "Vikram",
        last_name: "Rao",
        phone: "+91 99000 11104",
        role: "THERAPIST"
      },
      {
        email: "billing@wellness.com",
        password_hash: hash,
        first_name: "Kavita",
        last_name: "Reddy",
        phone: "+91 99000 11105",
        role: "BILLING_STAFF"
      },
      {
        email: "inventory@wellness.com",
        password_hash: hash,
        first_name: "Sunil",
        last_name: "Verma",
        phone: "+91 99000 11106",
        role: "INVENTORY_STAFF"
      },
      {
        email: "rahul@example.com",
        password_hash: clientHash,
        first_name: "Rahul",
        last_name: "Sharma",
        phone: "+91 98765 43210",
        role: "CLIENT"
      }
    ];

    const userMap = {};
    for (const u of usersToCreate) {
      const uRes = await client.query(
        `INSERT INTO users (organization_id, branch_id, first_name, last_name, email, password_hash, phone, role_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           password_hash = EXCLUDED.password_hash,
           role_id = EXCLUDED.role_id
         RETURNING id, email`,
        [orgId, branch1Id, u.first_name, u.last_name, u.email, u.password_hash, u.phone, roleMap[u.role]]
      );
      userMap[u.email] = uRes.rows[0].id;
      // also link in user_roles
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [uRes.rows[0].id, roleMap[u.role]]
      );
    }

    // 5. Practitioners table
    const practitioners = [
      {
        user_id: userMap["dr.sharma@wellness.com"],
        first_name: "Dr. Ananya",
        last_name: "Sharma",
        email: "dr.sharma@wellness.com",
        mobile: "+91 99000 11102",
        qualification: "MBBS, MD (Integrative Medicine)",
        experience_years: 10,
        license_number: "KMC-2016-8832",
        bio: "Specializing in holistic preventative medicine, stress biology, and comprehensive lifestyle health management.",
        specializations: ["Integrative Medicine", "Stress Management", "Lifestyle Disorders", "Wellness Assessments"]
      },
      {
        user_id: userMap["nutritionist@wellness.com"],
        first_name: "Priya",
        last_name: "Patel",
        email: "nutritionist@wellness.com",
        mobile: "+91 99000 11103",
        qualification: "M.Sc. Clinical Nutrition, RD",
        experience_years: 7,
        license_number: "IDA-2019-4112",
        bio: "Expert in metabolic health, anti-inflammatory nutrition, sustainable fat loss, and personalized meal planning.",
        specializations: ["Clinical Nutrition", "Weight Management", "Metabolic Health", "Gut Health"]
      },
      {
        user_id: userMap["therapist@wellness.com"],
        first_name: "Vikram",
        last_name: "Rao",
        email: "therapist@wellness.com",
        mobile: "+91 99000 11104",
        qualification: "BPT, Certified Yoga Therapist (AYUSH)",
        experience_years: 8,
        license_number: "IAP-2018-7714",
        bio: "Specialist in therapeutic yoga, postural alignment, musculoskeletal recovery, and deep restorative bodywork.",
        specializations: ["Yoga Therapy", "Physiotherapy", "Deep Tissue Massage", "Postural Rehabilitation"]
      }
    ];

    const practitionerMap = {};
    for (const p of practitioners) {
      const pRes = await client.query(
        `INSERT INTO practitioners (user_id, branch_id, first_name, last_name, email, mobile, qualification, experience_years, license_number, bio, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [p.user_id, branch1Id, p.first_name, p.last_name, p.email, p.mobile, p.qualification, p.experience_years, p.license_number, p.bio]
      );
      const pracId = pRes.rows[0]?.id || (await client.query("SELECT id FROM practitioners WHERE email = $1", [p.email])).rows[0].id;
      practitionerMap[p.email] = pracId;

      for (const spec of p.specializations) {
        await client.query(
          `INSERT INTO practitioner_specializations (practitioner_id, specialization)
           VALUES ($1, $2)`,
          [pracId, spec]
        );
      }

      // Add availability (Mon-Sat, 9:00 - 18:00)
      for (let day = 1; day <= 6; day++) {
        await client.query(
          `INSERT INTO practitioner_availability (practitioner_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available)
           VALUES ($1, $2, '09:00', '18:00', 60, true)`,
          [pracId, day]
        );
      }
    }

    // 6. Service Categories & Services
    const categories = [
      { name: "Consultations", description: "Clinical, medical & nutrition evaluations" },
      { name: "Therapies & Bodywork", description: "Hands-on restorative and rehabilitative sessions" },
      { name: "Mind-Body Medicine", description: "Yoga therapy, breathwork and mindfulness" },
      { name: "Specialized Programs", description: "Targeted multi-modality health protocols" }
    ];

    const catMap = {};
    for (const c of categories) {
      const res = await client.query(
        `INSERT INTO service_categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [c.name, c.description]
      );
      catMap[c.name] = res.rows[0].id;
    }

    const services = [
      {
        name: "Comprehensive Wellness Assessment",
        category: "Consultations",
        description: "Full biometric, lifestyle, nutritional & posture review with diagnostic scoring",
        duration_minutes: 60,
        price: 2500,
        tax_rate: 18,
        practitioners: ["dr.sharma@wellness.com"]
      },
      {
        name: "Nutrition Consultation & Diet Planning",
        category: "Consultations",
        description: "Personalized metabolic and macronutrient diet plan tailored to personal goals",
        duration_minutes: 45,
        price: 1800,
        tax_rate: 18,
        practitioners: ["nutritionist@wellness.com"]
      },
      {
        name: "Yoga Therapy & Breathwork",
        category: "Mind-Body Medicine",
        description: "One-on-one tailored asana, pranayama and autonomic nervous system regulation",
        duration_minutes: 60,
        price: 1500,
        tax_rate: 18,
        practitioners: ["therapist@wellness.com"]
      },
      {
        name: "Deep Tissue & Myofascial Therapy",
        category: "Therapies & Bodywork",
        description: "Targeted deep bodywork addressing muscular tension, knots, and flexibility limits",
        duration_minutes: 60,
        price: 2800,
        tax_rate: 18,
        practitioners: ["therapist@wellness.com"]
      },
      {
        name: "Weight Management Protocol",
        category: "Specialized Programs",
        description: "Integrated fat loss review combining body composition scans and routine refinement",
        duration_minutes: 45,
        price: 2200,
        tax_rate: 18,
        practitioners: ["dr.sharma@wellness.com", "nutritionist@wellness.com"]
      },
      {
        name: "Mindfulness & Stress Meditation",
        category: "Mind-Body Medicine",
        description: "Guided mindfulness, vagus nerve stimulation, and cortisol reduction coaching",
        duration_minutes: 45,
        price: 1200,
        tax_rate: 18,
        practitioners: ["dr.sharma@wellness.com", "therapist@wellness.com"]
      }
    ];

    const serviceMap = {};
    for (const s of services) {
      const sRes = await client.query(
        `INSERT INTO services (category_id, branch_id, name, description, duration_minutes, price, tax_rate, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id, name`,
        [catMap[s.category], branch1Id, s.name, s.description, s.duration_minutes, s.price, s.tax_rate]
      );
      const svcId = sRes.rows[0].id;
      serviceMap[s.name] = svcId;

      for (const pEmail of s.practitioners) {
        const pId = practitionerMap[pEmail];
        if (pId) {
          await client.query(
            `INSERT INTO practitioner_services (practitioner_id, service_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [pId, svcId]
          );
        }
      }
    }

    // 7. Generic Goal Categories & Types
    const goalCategories = [
      { name: "Weight & Body Composition", description: "Weight loss, muscle gain, body fat metrics" },
      { name: "Physical Fitness & Vitality", description: "Strength, endurance, steps, flexibility" },
      { name: "Mental & Sleep Wellness", description: "Stress reduction, meditation, deep sleep" },
      { name: "Lifestyle & Daily Habits", description: "Hydration, nutrition tracking, screen-time balance" }
    ];

    const goalCatMap = {};
    for (const gc of goalCategories) {
      const gRes = await client.query(
        `INSERT INTO goal_categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [gc.name, gc.description]
      );
      goalCatMap[gc.name] = gRes.rows[0].id;
    }

    const goalTypes = [
      { name: "Weight Loss", category: "Weight & Body Composition", default_metric: "Weight", default_unit: "kg", target_direction: "DECREASE", value_type: "DECIMAL" },
      { name: "Weight Gain", category: "Weight & Body Composition", default_metric: "Weight", default_unit: "kg", target_direction: "INCREASE", value_type: "DECIMAL" },
      { name: "Body Fat Reduction", category: "Weight & Body Composition", default_metric: "Body Fat", default_unit: "%", target_direction: "DECREASE", value_type: "DECIMAL" },
      { name: "Muscle Gain", category: "Weight & Body Composition", default_metric: "Muscle Mass", default_unit: "kg", target_direction: "INCREASE", value_type: "DECIMAL" },
      { name: "Sleep Improvement", category: "Mental & Sleep Wellness", default_metric: "Sleep Duration", default_unit: "hours", target_direction: "INCREASE", value_type: "DECIMAL" },
      { name: "Daily Meditation", category: "Mental & Sleep Wellness", default_metric: "Meditation Time", default_unit: "minutes", target_direction: "INCREASE", value_type: "DURATION" },
      { name: "Daily Hydration", category: "Lifestyle & Daily Habits", default_metric: "Water Intake", default_unit: "L", target_direction: "INCREASE", value_type: "DECIMAL" },
      { name: "Daily Steps", category: "Physical Fitness & Vitality", default_metric: "Steps Count", default_unit: "steps", target_direction: "INCREASE", value_type: "COUNT" },
      { name: "Weekly Exercise Frequency", category: "Physical Fitness & Vitality", default_metric: "Workouts", default_unit: "sessions/week", target_direction: "INCREASE", value_type: "COUNT" }
    ];

    const goalTypeMap = {};
    for (const gt of goalTypes) {
      const gtRes = await client.query(
        `INSERT INTO goal_types (category_id, name, default_metric, default_unit, target_direction, value_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name`,
        [goalCatMap[gt.category], gt.name, gt.default_metric, gt.default_unit, gt.target_direction, gt.value_type]
      );
      goalTypeMap[gt.name] = gtRes.rows[0].id;
    }

    // 8. Demo Client (Rahul Sharma)
    const clientUser = userMap["rahul@example.com"];
    const clientRes = await client.query(
      `INSERT INTO clients (user_id, branch_id, client_code, first_name, last_name, date_of_birth, age, gender, mobile, email, preferred_language, medical_notes, is_active)
       VALUES ($1, $2, 'WC-2026-001', 'Rahul', 'Sharma', '1992-05-15', 34, 'Male', '+91 98765 43210', 'rahul@example.com', 'English', 'Occasional lower back tightness, borderline elevated cholesterol.', true)
       RETURNING id`,
      [clientUser, branch1Id]
    );
    const clientId = clientRes.rows[0].id;

    // Client Address & Emergency Contact
    await client.query(
      `INSERT INTO client_addresses (client_id, address_line1, address_line2, city, state, country, pincode, is_primary)
       VALUES ($1, 'Flat 402, Green Acres Apt', '12th Main Road, Indiranagar', 'Bengaluru', 'Karnataka', 'India', '560038', true)`,
      [clientId]
    );

    await client.query(
      `INSERT INTO client_emergency_contacts (client_id, contact_name, relationship, mobile, email)
       VALUES ($1, 'Sneha Sharma', 'Spouse', '+91 98765 43211', 'sneha.sharma@example.com')`,
      [clientId]
    );

    // 9. Initial Assessment for Demo Client
    const assessRes = await client.query(
      `INSERT INTO wellness_assessments (
        client_id, branch_id, practitioner_id, assessment_date,
        weight, height, bmi, body_fat_pct, muscle_mass_kg, waist_circumference_cm,
        water_intake_l, sleep_hours, exercise_freq_weekly, stress_level,
        lifestyle_notes, nutrition_notes, clinical_notes
      ) VALUES ($1, $2, $3, '2026-10-07', 85.00, 175.00, 27.76, 28.50, 42.00, 94.00, 1.50, 5.50, 2, 'HIGH',
        'Sedentary desk job with high working hours. Late dinners and irregular sleep schedule.',
        'High refined carbohydrate and coffee intake. Inadequate protein and hydration.',
        'Primary recommendation: 12-week supervised metabolic reset and gradual fat reduction from 85 kg to 72 kg.'
      ) RETURNING id`,
      [clientId, branch1Id, practitionerMap["dr.sharma@wellness.com"]]
    );
    const assessId = assessRes.rows[0].id;

    await client.query(
      `INSERT INTO wellness_assessment_metrics (assessment_id, metric_name, metric_value, unit, notes)
       VALUES
       ($1, 'Resting Heart Rate', 78, 'bpm', 'Mild elevation due to caffeine'),
       ($1, 'Blood Pressure Systolic', 128, 'mmHg', 'Pre-hypertensive threshold'),
       ($1, 'Blood Pressure Diastolic', 82, 'mmHg', 'Normal-high')`,
      [assessId]
    );

    // 10. Demo Goal (Weight Loss: 85kg -> 72kg)
    const goalRes = await client.query(
      `INSERT INTO wellness_goals (
        client_id, practitioner_id, branch_id, goal_type_id, goal_name,
        description, priority, start_date, target_date, status
      ) VALUES ($1, $2, $3, $4, 'Healthy Weight Loss & Metabolic Reset',
        'Target weight reduction from 85 kg to 72 kg to optimize metabolic biomarkers and stamina.',
        'HIGH', '2026-10-07', '2027-01-07', 'ACTIVE'
      ) RETURNING id`,
      [clientId, practitionerMap["nutritionist@wellness.com"], branch1Id, goalTypeMap["Weight Loss"]]
    );
    const goalId = goalRes.rows[0].id;

    // Goal Target
    await client.query(
      `INSERT INTO goal_targets (goal_id, metric_name, starting_value, current_value, target_value, unit, direction, value_type)
       VALUES ($1, 'Weight', 85.00, 82.40, 72.00, 'kg', 'DECREASE', 'DECIMAL')`,
      [goalId]
    );

    // Goal Milestones
    const milestones = [
      { seq: 1, target: 82.00, date: '2026-10-28', status: 'ACHIEVED', achieved_date: '2026-10-28', notes: 'Phase 1: Water retention reduction and clean gut reset' },
      { seq: 2, target: 79.00, date: '2026-11-25', status: 'ACTIVE', achieved_date: null, notes: 'Phase 2: Steady fat burn with resistance training' },
      { seq: 3, target: 76.00, date: '2026-12-23', status: 'PENDING', achieved_date: null, notes: 'Phase 3: Deep metabolic adaptation and posture correction' },
      { seq: 4, target: 72.00, date: '2027-01-07', status: 'PENDING', achieved_date: null, notes: 'Phase 4: Target achievement and maintenance stabilization' }
    ];

    for (const m of milestones) {
      await client.query(
        `INSERT INTO goal_milestones (goal_id, sequence_order, target_value, target_date, status, achieved_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [goalId, m.seq, m.target, m.date, m.status, m.achieved_date, m.notes]
      );
    }

    // Historical Measurements
    const measurements = [
      { date: '2026-10-07', val: 85.00, notes: 'Initial baseline assessment weight' },
      { date: '2026-10-14', val: 83.80, notes: 'Week 1 check-in: -1.2kg, significant reduction in bloat' },
      { date: '2026-10-21', val: 83.10, notes: 'Week 2 progress: steady fat loss, increased energy levels' },
      { date: '2026-10-28', val: 82.40, notes: 'Week 3 milestone achieved: reached 82.4kg' }
    ];

    for (const meas of measurements) {
      await client.query(
        `INSERT INTO goal_measurements (goal_id, recorded_date, recorded_value, notes, recorded_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [goalId, meas.date, meas.val, meas.notes, userMap["nutritionist@wellness.com"]]
      );
    }

    // 11. Wellness Plan (12-Week Weight Loss & Metabolic Vitality)
    const planRes = await client.query(
      `INSERT INTO wellness_plans (branch_id, name, description, duration_weeks, price, is_active)
       VALUES ($1, '12-Week Weight Loss & Metabolic Vitality Plan',
        'A comprehensive multi-disciplinary program including clinical nutrition consultations, yoga therapy sessions, and progressive home activities.',
        12, 14999.00, true
       ) RETURNING id`,
      [branch1Id]
    );
    const planId = planRes.rows[0].id;

    // Services in plan
    await client.query(
      `INSERT INTO wellness_plan_services (wellness_plan_id, service_id, sessions_count)
       VALUES
       ($1, $2, 4),
       ($1, $3, 12),
       ($1, $4, 6)`,
      [planId, serviceMap["Nutrition Consultation & Diet Planning"], serviceMap["Yoga Therapy & Breathwork"], serviceMap["Deep Tissue & Myofascial Therapy"]]
    );

    // Activities in plan
    await client.query(
      `INSERT INTO wellness_plan_activities (wellness_plan_id, activity_name, frequency, duration_minutes, instructions)
       VALUES
       ($1, 'Brisk Morning Walk', 'Daily', 30, 'Brisk pace outdoors before 8 AM for circadian alignment'),
       ($1, 'Pranayama & Breathing', 'Daily', 15, 'Nadi Shodhana & Anulom Vilom before sleep'),
       ($1, 'Core Stability Work', '3 times / week', 25, 'Planks, bird-dogs and glute bridges')`,
      [planId]
    );

    // Client's active wellness plan
    await client.query(
      `INSERT INTO client_wellness_plans (client_id, wellness_plan_id, goal_id, practitioner_id, start_date, end_date, status, notes)
       VALUES ($1, $2, $3, $4, '2026-10-07', '2027-01-07', 'ACTIVE', 'Client enrolled in week 4 with excellent compliance.')`,
      [clientId, planId, goalId, practitionerMap["nutritionist@wellness.com"]]
    );

    // 12. Products, Categories, Brands & Inventory
    const prodCatRes = await client.query(
      `INSERT INTO product_categories (name, description)
       VALUES
       ('Herbal Infusions & Teas', 'Organic herbal teas for digestion, detox, and relaxation'),
       ('Nutritional Supplements', 'Clean plant proteins, minerals, and organic daily boosters'),
       ('Therapeutic Oils', 'Traditional herbalized cold-pressed wellness oils for Abhyanga and pain relief'),
       ('Mindful Living Kits', 'Aromatherapy diffusers, meditation cushions, and wellness essentials')
       RETURNING id, name`
    );
    const prodCats = {};
    prodCatRes.rows.forEach(r => prodCats[r.name] = r.id);

    const brandRes = await client.query(
      `INSERT INTO product_brands (name, description)
       VALUES
       ('Aura Herbals', 'In-house certified organic herbal formulations'),
       ('Prana Botanicals', 'Handcrafted cold-pressed therapeutic oils and essences'),
       ('PureMetabolic', 'Clean science-backed nutraceuticals and proteins')
       RETURNING id, name`
    );
    const brands = {};
    brandRes.rows.forEach(r => brands[r.name] = r.id);

    const products = [
      {
        name: "Aura Slim & Detox Herbal Tea (100g)",
        sku: "TEA-SLIM-100",
        category: "Herbal Infusions & Teas",
        brand: "Aura Herbals",
        description: "Infusion of garcinia, lemongrass, ginger and triphala to support healthy metabolic rate and digestion.",
        price: 499.00,
        cost_price: 220.00,
        tax_rate: 12,
        image_url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "PureMetabolic Plant Protein 1kg - Vanilla",
        sku: "SUP-PROT-1KG",
        category: "Nutritional Supplements",
        brand: "PureMetabolic",
        description: "Pea & brown rice isolate with digestive enzymes, zero added sugar, 26g protein per serving.",
        price: 2499.00,
        cost_price: 1350.00,
        tax_rate: 18,
        image_url: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "Prana Ashwagandha & Sesame Wellness Body Oil (200ml)",
        sku: "OIL-ASHWA-200",
        category: "Therapeutic Oils",
        brand: "Prana Botanicals",
        description: "Enriched Ayurvedic oil with Bala and Ashwagandha to calm Vata, relieve muscle aches, and promote restorative sleep.",
        price: 850.00,
        cost_price: 380.00,
        tax_rate: 12,
        image_url: "https://images.unsplash.com/photo-1608248597359-0f048d0a8767?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "Aura Calm & Sleep Chamomile Elixir (50ml)",
        sku: "EXT-SLEEP-50",
        category: "Herbal Infusions & Teas",
        brand: "Aura Herbals",
        description: "Herbal sleep drops infused with Brahmi, Chamomile, and Jatamansi for restful REM sleep.",
        price: 650.00,
        cost_price: 280.00,
        tax_rate: 12,
        image_url: "https://images.unsplash.com/photo-1512290900672-1f5be508b9f1?auto=format&fit=crop&w=600&q=80"
      },
      {
        name: "PureMetabolic Electrolyte Hydration Salts (30 sachets)",
        sku: "SUP-ELEC-30",
        category: "Nutritional Supplements",
        brand: "PureMetabolic",
        description: "Sugar-free optimal sodium, potassium, and magnesium complex for cellular hydration during weight loss.",
        price: 799.00,
        cost_price: 350.00,
        tax_rate: 18,
        image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80"
      }
    ];

    const prodMap = {};
    for (const p of products) {
      const pRes = await client.query(
        `INSERT INTO products (category_id, brand_id, name, sku, description, price, cost_price, tax_rate, image_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
         RETURNING id, name, sku`,
        [prodCats[p.category], brands[p.brand], p.name, p.sku, p.description, p.price, p.cost_price, p.tax_rate, p.image_url]
      );
      prodMap[p.sku] = pRes.rows[0].id;
    }

    // Inventory Location & Stock
    const locRes = await client.query(
      `INSERT INTO inventory_locations (branch_id, name, description)
       VALUES ($1, 'Main Pharmacy & Retail Store', 'Central shelf dispensary')
       RETURNING id`,
      [branch1Id]
    );
    const locId = locRes.rows[0].id;

    for (const p of products) {
      const pId = prodMap[p.sku];
      await client.query(
        `INSERT INTO inventory_stock (branch_id, product_id, batch_number, expiry_date, quantity, purchase_price, selling_price, location_id)
         VALUES ($1, $2, 'BAT-2026-A1', '2027-10-01', 45, $3, $4, $5)`,
        [branch1Id, pId, p.cost_price, p.price, locId]
      );

      await client.query(
        `INSERT INTO inventory_transactions (branch_id, product_id, transaction_type, quantity, batch_number, notes)
         VALUES ($1, $2, 'PURCHASE', 45, 'BAT-2026-A1', 'Initial stock intake from Aura Distribution Hub')`,
        [branch1Id, pId]
      );
    }

    // Supplier & Purchase Order
    const supRes = await client.query(
      `INSERT INTO suppliers (branch_id, name, contact_person, email, phone, address, gst_tax_number)
       VALUES ($1, 'Veda Natural Organics Ltd', 'Rajesh Kulkarni', 'orders@vedanaturals.com', '+91 80 2345 6789', 'Peenya Industrial Area, Bengaluru', '29AABCV1234F1Z8')
       RETURNING id`,
      [branch1Id]
    );
    const supId = supRes.rows[0].id;

    // 13. Product Recommendations for Demo Client Rahul Sharma
    await client.query(
      `INSERT INTO product_recommendations (client_id, practitioner_id, product_id, reason, dosage_notes, status)
       VALUES
       ($1, $2, $3, 'Recommended for accelerating morning fat metabolism and reducing mid-day cravings.', '1 cup 30 minutes after breakfast and 1 cup before 6 PM.', 'ACTIVE'),
       ($1, $2, $4, 'Prescribed to ensure adequate lean muscle preservation during weight loss protocol.', '1 scoop (30g) mixed with 250ml water immediately post-exercise.', 'ACTIVE'),
       ($1, $5, $6, 'Recommended for self-massage (Abhyanga) on lower back and feet before sleep.', 'Apply warm oil, massage gently, wash with warm water after 20 mins.', 'ACTIVE')`,
      [
        clientId,
        practitionerMap["nutritionist@wellness.com"],
        prodMap["TEA-SLIM-100"],
        prodMap["SUP-PROT-1KG"],
        practitionerMap["therapist@wellness.com"],
        prodMap["OIL-ASHWA-200"]
      ]
    );

    // 14. Demo Appointments
    // Past completed appointment (Initial Assessment)
    const apt1Res = await client.query(
      `INSERT INTO appointments (
        appointment_number, client_id, branch_id, service_id, practitioner_id,
        appointment_date, start_time, end_time, status, booking_source, notes, created_by
      ) VALUES (
        'APT-2026-1001', $1, $2, $3, $4,
        '2026-10-07', '10:00', '11:00', 'COMPLETED', 'WALK_IN', 'Initial wellness intake and diagnostic evaluation completed successfully.', $5
      ) RETURNING id`,
      [clientId, branch1Id, serviceMap["Comprehensive Wellness Assessment"], practitionerMap["dr.sharma@wellness.com"], userMap["reception@wellness.com"]]
    );

    // Upcoming Confirmed appointment
    const apt2Res = await client.query(
      `INSERT INTO appointments (
        appointment_number, client_id, branch_id, service_id, practitioner_id,
        appointment_date, start_time, end_time, status, booking_source, notes, created_by
      ) VALUES (
        'APT-2026-1002', $1, $2, $3, $4,
        '2026-10-10', '11:30', '12:15', 'CONFIRMED', 'CLIENT_PORTAL', 'Follow-up nutrition and micronutrient calibration review.', $5
      ) RETURNING id`,
      [clientId, branch1Id, serviceMap["Nutrition Consultation & Diet Planning"], practitionerMap["nutritionist@wellness.com"], userMap["rahul@example.com"]]
    );

    // Another booked appointment (Yoga Therapy)
    await client.query(
      `INSERT INTO appointments (
        appointment_number, client_id, branch_id, service_id, practitioner_id,
        appointment_date, start_time, end_time, status, booking_source, notes, created_by
      ) VALUES (
        'APT-2026-1003', $1, $2, $3, $4,
        '2026-10-14', '09:00', '10:00', 'BOOKED', 'CLIENT_PORTAL', 'Session 1: Posture rehabilitation & Diaphragmatic breathing.', $5
      )`,
      [clientId, branch1Id, serviceMap["Yoga Therapy & Breathwork"], practitionerMap["therapist@wellness.com"], userMap["rahul@example.com"]]
    );

    // 15. Packages & Memberships
    const pkgRes = await client.query(
      `INSERT INTO packages (branch_id, name, description, duration_days, price, is_active)
       VALUES ($1, '30-Day Total Rejuvenation Package',
        'Includes 4 Consultations, 8 Yoga Therapy sessions, and 4 Deep Restorative Bodywork treatments.',
        30, 15000.00, true
       ) RETURNING id`,
      [branch1Id]
    );
    const pkgId = pkgRes.rows[0].id;

    // Client Package
    await client.query(
      `INSERT INTO client_packages (client_id, package_id, purchase_date, expiry_date, total_sessions, used_sessions, status)
       VALUES ($1, $2, '2026-10-07', '2026-11-06', 16, 2, 'ACTIVE')`,
      [clientId, pkgId]
    );

    // Membership Plans
    const memPlans = [
      { name: "Silver Wellness Tier", tier: "SILVER", duration_months: 6, price: 5999.00, discount_percent: 10.00, benefits: "10% discount on all consultations, herbal supplements & bodywork therapies." },
      { name: "Gold Wellness Tier", tier: "GOLD", duration_months: 12, price: 11999.00, discount_percent: 15.00, benefits: "15% discount on all services & retail products, plus 2 complimentary diagnostic scans per year." },
      { name: "Platinum VIP Wellness Tier", tier: "PLATINUM", duration_months: 12, price: 24999.00, discount_percent: 25.00, benefits: "25% discount, priority booking queue, dedicated wellness physician, complimentary tea sets." }
    ];

    for (const mp of memPlans) {
      const mpRes = await client.query(
        `INSERT INTO membership_plans (branch_id, name, tier, duration_months, price, discount_percent, benefits_description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id`,
        [branch1Id, mp.name, mp.tier, mp.duration_months, mp.price, mp.discount_percent, mp.benefits]
      );

      if (mp.tier === "GOLD") {
        await client.query(
          `INSERT INTO client_memberships (client_id, membership_plan_id, start_date, end_date, renewal_date, status, discount_percent)
           VALUES ($1, $2, '2026-10-07', '2027-10-06', '2027-10-06', 'ACTIVE', 15.00)`,
          [clientId, mpRes.rows[0].id]
        );
      }
    }

    // 16. Invoices, Invoice Items & Payments
    const invRes = await client.query(
      `INSERT INTO invoices (
        invoice_number, client_id, branch_id, invoice_date, due_date,
        subtotal, discount, tax, total_amount, paid_amount, balance_amount, status, notes, created_by
      ) VALUES (
        'INV-2026-001', $1, $2, '2026-10-07', '2026-10-07',
        2500.00, 0.00, 450.00, 2950.00, 2950.00, 0.00, 'PAID', 'Initial Comprehensive Wellness Assessment invoice.', $3
      ) RETURNING id`,
      [clientId, branch1Id, userMap["billing@wellness.com"]]
    );
    const invId = invRes.rows[0].id;

    await client.query(
      `INSERT INTO invoice_items (invoice_id, item_type, reference_id, description, quantity, unit_price, tax_rate, tax_amount, total_amount)
       VALUES ($1, 'SERVICE', $2, 'Comprehensive Wellness Assessment', 1, 2500.00, 18.00, 450.00, 2950.00)`,
      [invId, serviceMap["Comprehensive Wellness Assessment"]]
    );

    const payRes = await client.query(
      `INSERT INTO payments (
        payment_number, client_id, branch_id, invoice_id, amount, payment_method,
        payment_date, transaction_reference, notes, received_by
      ) VALUES (
        'PAY-2026-001', $1, $2, $3, 2950.00, 'UPI',
        '2026-10-07', 'UPI/20261007994821', 'Paid via Google Pay / UPI', $4
      ) RETURNING id`,
      [clientId, branch1Id, invId, userMap["billing@wellness.com"]]
    );

    await client.query(
      `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount)
       VALUES ($1, $2, 2950.00)`,
      [payRes.rows[0].id, invId]
    );

    // 17. Client Activities (Hydration, Steps, Yoga)
    const actRes = await client.query(
      `INSERT INTO activity_master (name, category, default_unit, description)
       VALUES
       ('Daily Water Intake', 'Hydration', 'L', 'Hydration target tracker'),
       ('Brisk Morning Walk', 'Cardio', 'steps', 'Daily physical movement steps count'),
       ('Evening Yoga / Stretch', 'Mind-Body', 'minutes', 'Restorative stretching before bed')
       RETURNING id, name`
    );
    const actMap = {};
    actRes.rows.forEach(r => actMap[r.name] = r.id);

    await client.query(
      `INSERT INTO client_activities (client_id, activity_id, target_daily, unit)
       VALUES
       ($1, $2, 3.0, 'L'),
       ($1, $3, 8000, 'steps'),
       ($1, $4, 20, 'minutes')`,
      [clientId, actMap['Daily Water Intake'], actMap['Brisk Morning Walk'], actMap['Evening Yoga / Stretch']]
    );

    await client.query(
      `INSERT INTO activity_logs (client_id, activity_id, log_date, duration_minutes, count_value, notes)
       VALUES
       ($1, $2, '2026-10-07', NULL, 2.5, 'Drank warm water and herbal tea'),
       ($1, $3, '2026-10-07', 35, 7420, 'Morning walk in neighborhood park'),
       ($1, $4, '2026-10-07', 20, NULL, 'Gentle restorative yoga')`,
      [clientId, actMap['Daily Water Intake'], actMap['Brisk Morning Walk'], actMap['Evening Yoga / Stretch']]
    );

    // 18. Notifications
    await client.query(
      `INSERT INTO notifications (user_id, client_id, title, message, type, link)
       VALUES
       ($1, $2, 'Welcome to Aura Life Wellness Centre!', 'Your personalized wellness account has been activated. View your dashboard to explore your health goals and plans.', 'INFO', '/dashboard'),
       ($1, $2, 'New Milestone Achieved! 🎉', 'Congratulations! You reached your 82.0 kg milestone on 28-Oct. Keep up the phenomenal work!', 'SUCCESS', '/goals'),
       ($1, $2, 'Practitioner Recommendations Ready', 'Dr. Ananya Sharma and Priya Patel have added personalized products to your wellness recommendations.', 'INFO', '/recommendations')`,
      [clientUser, clientId]
    );

    // 19. Audit Logs
    await client.query(
      `INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, new_data)
       VALUES
       ($1, 'SYSTEM_SEEDED', 'SYSTEM', 'DATABASE', NULL, '{"message": "Complete seed data populated with roles, demo users, services, products, and client journey."}'),
       ($1, 'CLIENT_CREATED', 'CLIENT', 'clients', $2, '{"name": "Rahul Sharma", "client_code": "WC-2026-001"}'),
       ($1, 'GOAL_CREATED', 'GOALS', 'wellness_goals', $3, '{"name": "Healthy Weight Loss & Metabolic Reset", "start": 85, "target": 72}')`,
      [userMap["admin@wellness.com"], clientId, goalId]
    );

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
