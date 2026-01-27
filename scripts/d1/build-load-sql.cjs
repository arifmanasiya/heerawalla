const fs = require("fs");
const path = require("path");

const src = path.join("scripts", "d1", "seed", "remote_dump_full.sql");
const out = path.join("scripts", "d1", "seed", "remote_dump_load.sql");

const text = fs.readFileSync(src, "utf8").replace(/\r/g, " ");
const statements = text
  .split(";\n")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s.replace(/\n+/g, " ").replace(/\s+/g, " ").trim());

const insert = [];
const tables = new Set();

for (const stmt of statements) {
  const upper = stmt.toUpperCase();
  if (!upper.startsWith("INSERT")) continue;
  if (upper.includes("D1_MIGRATIONS")) continue;
  insert.push(stmt + ";");
  const m = upper.match(/INTO\s+([`"\[]?)([^\s`"\[]+)/);
  if (m) tables.add(m[2].replace(/[`"\[\]]/g, "").toLowerCase());
}

const order = [
  "catalog_items",
  "catalog_media",
  "catalog_metal_options",
  "catalog_notes",
  "catalog_stone_options",
  "contacts",
  "cost_chart",
  "diamond_clarity_groups",
  "diamond_price_chart",
  "media_library",
  "order_details",
  "orders",
  "price_chart",
  "quotes",
  "site_config",
  "ticket_details",
  "tickets",
  "unified_contacts",
];

for (const t of tables) {
  const lower = t.toLowerCase();
  if (!order.includes(lower)) order.push(lower);
}

const outLines = ["PRAGMA foreign_keys=OFF;"];
for (const t of order) outLines.push(`DELETE FROM "${t}";`);
outLines.push(...insert);
outLines.push("PRAGMA foreign_keys=ON;");

fs.writeFileSync(out, outLines.join("\n") + "\n", "utf8");
console.log("tables", order.length, "lines", outLines.length);
