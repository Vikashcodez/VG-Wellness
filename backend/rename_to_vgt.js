import pool from "./src/config/db.js";

async function renameAndFix() {
  console.log("Renaming Organization 1 and branches...");
  await pool.query("UPDATE organizations SET name = $1, code = $2 WHERE id = 1", [
    "VGT Wellness Centre Management",
    "VGT-HQ"
  ]);
  await pool.query("UPDATE branches SET name = $1, code = $2 WHERE id = 1", [
    "VGT Flagship Centre",
    "VGT-BLR-01"
  ]);
  await pool.query("UPDATE branches SET name = $1, code = $2 WHERE id = 2", [
    "VGT Serenity Retreat",
    "VGT-MUM-01"
  ]);
  console.log("Renaming completed successfully!");
  process.exit(0);
}

renameAndFix().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
