import pool from "./src/config/db.js";

async function seedCategories() {
  console.log("Seeding universal wellness master categories & brands...");

  // 1. Update existing to organization_id = NULL so all centres can access them
  await pool.query("UPDATE service_categories SET organization_id = NULL WHERE organization_id IS NOT NULL");
  await pool.query("UPDATE product_categories SET organization_id = NULL WHERE organization_id IS NOT NULL");
  await pool.query("UPDATE product_brands SET organization_id = NULL WHERE organization_id IS NOT NULL");

  // 2. Comprehensive Service Categories
  const serviceCategories = [
    { name: "Consultations & Diagnostic Assessments", description: "Clinical doctor consultations, Nadi Pariksha, metabolic and nutrition evaluations" },
    { name: "Ayurvedic Therapies & Panchakarma", description: "Authentic Abhyanga, Shirodhara, Kizhi, Basti, and detoxification procedures" },
    { name: "Naturopathy & Hydrotherapy", description: "Mud therapy, steam baths, colon hydrotherapy, and natural healing protocols" },
    { name: "Yoga, Pranayama & Meditation", description: "Therapeutic yoga postures, guided breathwork, and mindfulness meditation" },
    { name: "Physiotherapy & Bodywork", description: "Spinal alignment, therapeutic deep tissue massage, and joint rehabilitation" },
    { name: "Nutrition & Metabolic Dietetics", description: "Personalized dosha diet charts, gut health restoration, and clinical meal plans" },
    { name: "Holistic Skin & Aesthetic Care", description: "Mukha Lepam herbal facials, scalp treatments, and natural glow therapies" },
    { name: "Stress Release & Sound Healing", description: "Tibetan singing bowl resonance, sound bath therapy, and sleep restoration" }
  ];

  for (const sc of serviceCategories) {
    const exists = await pool.query("SELECT id FROM service_categories WHERE LOWER(name) = LOWER($1)", [sc.name]);
    if (exists.rowCount === 0) {
      await pool.query(
        "INSERT INTO service_categories (organization_id, name, description, is_active) VALUES (NULL, $1, $2, true)",
        [sc.name, sc.description]
      );
      console.log(`Inserted service category: ${sc.name}`);
    }
  }

  // 3. Comprehensive Product Categories
  const productCategories = [
    { name: "Herbal Infusions & Wellness Teas", description: "Organic herbal blends for digestion, sleep, detox, and immunity" },
    { name: "Nutritional Supplements & Vitamins", description: "Clean science-backed nutraceuticals, plant proteins, and multivitamins" },
    { name: "Therapeutic Oils & Formulations", description: "Authentic cold-pressed medicated oils for Abhyanga, joints, and hair" },
    { name: "Ayurvedic Kwaths, Asavas & Churnas", description: "Traditional classical formulations for holistic wellness and vitality" },
    { name: "Organic Superfoods & Daily Boosters", description: "Spirulina, moringa, amla extract, and raw metabolic superfoods" },
    { name: "Natural Skin & Hair Care", description: "Chemical-free herbal creams, cleansers, serums, and natural ubtan" },
    { name: "Essential Oils & Aromatherapy", description: "Pure steam-distilled lavender, eucalyptus, lemongrass, and diffuser oils" },
    { name: "Mindful Living Kits & Accessories", description: "Copper water vessels, yoga mats, diffusers, and meditation essentials" }
  ];

  for (const pc of productCategories) {
    const exists = await pool.query("SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1)", [pc.name]);
    if (exists.rowCount === 0) {
      await pool.query(
        "INSERT INTO product_categories (organization_id, name, description, is_active) VALUES (NULL, $1, $2, true)",
        [pc.name, pc.description]
      );
      console.log(`Inserted product category: ${pc.name}`);
    }
  }

  // 4. Product Brands
  const productBrands = [
    { name: "Aura Herbals", description: "In-house certified organic herbal formulations" },
    { name: "Prana Botanicals", description: "Handcrafted cold-pressed therapeutic oils and essences" },
    { name: "PureMetabolic Nutrition", description: "Clean science-backed nutraceuticals and plant proteins" },
    { name: "Veda Essentials", description: "Traditional Ayurvedic botanical extracts and teas" },
    { name: "Himalayan Organics", description: "Pure herbal extracts from high-altitude Himalayan farms" },
    { name: "Kerala Ayurveda Care", description: "Authentic classical oils, churnas, and herbal remedies" }
  ];

  for (const pb of productBrands) {
    const exists = await pool.query("SELECT id FROM product_brands WHERE LOWER(name) = LOWER($1)", [pb.name]);
    if (exists.rowCount === 0) {
      await pool.query(
        "INSERT INTO product_brands (organization_id, name, description, is_active) VALUES (NULL, $1, $2, true)",
        [pb.name, pb.description]
      );
      console.log(`Inserted product brand: ${pb.name}`);
    }
  }

  console.log("Master categories and brands successfully verified and seeded!");
  process.exit(0);
}

seedCategories().catch(err => {
  console.error("Error seeding categories:", err);
  process.exit(1);
});
