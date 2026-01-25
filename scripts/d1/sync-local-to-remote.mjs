import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DB_NAME = "heerawalla";
const CONFIG_PATH = "workers/herawalla-email-atelier/wrangler.toml";
const OUTPUT_PATH = "scripts/d1/seed/local_dump.sql";
const D1_PERSIST_DIR = ".wrangler/state/v3";
const TABLES = [
  "catalog_items",
  "catalog_notes",
  "catalog_stone_options",
  "catalog_metal_options",
  "media_library",
  "catalog_media",
  "site_config",
  "price_chart",
  "cost_chart",
  "diamond_price_chart",
  "diamond_clarity_groups",
  "orders",
  "order_details",
  "quotes",
  "contacts",
  "unified_contacts",
];

function runWrangler(args) {
  const isWin = process.platform === "win32";
  const command = isWin ? process.env.ComSpec || "cmd.exe" : "npx";
  const commandArgs = isWin ? ["/c", "npx", "wrangler", ...args] : ["wrangler", ...args];
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "wrangler_failed");
  }
  return result.stdout.trim();
}

function runLocalJson(command) {
  const output = runWrangler([
    "d1",
    "execute",
    DB_NAME,
    "--local",
    "--persist-to",
    D1_PERSIST_DIR,
    "--json",
    "--command",
    command,
    "--config",
    CONFIG_PATH,
  ]);
  const parsed = JSON.parse(output);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry?.success) return [];
  return entry.results || [];
}

function runRemoteJson(command) {
  const output = runWrangler([
    "d1",
    "execute",
    DB_NAME,
    "--remote",
    "--json",
    "--command",
    command,
    "--config",
    CONFIG_PATH,
  ]);
  const parsed = JSON.parse(output);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry?.success) return [];
  return entry.results || [];
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

function buildInsert(table, columns, rows) {
  if (!rows.length) return "";
  const statements = rows.map((row) => {
    const values = columns.map((col) => sqlValue(row[col]));
    return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  });
  return statements.join("\n");
}

function main() {
  const remoteTables = new Set(
    runRemoteJson("SELECT name FROM sqlite_master WHERE type='table'").map((row) =>
      String(row.name || "")
    )
  );
  const selectedTables = TABLES.filter((table) => remoteTables.has(table));
  const lines = [
    "PRAGMA foreign_keys = OFF;",
    ...selectedTables.map((table) => `DELETE FROM ${table};`),
    "PRAGMA foreign_keys = ON;",
  ];

  selectedTables.forEach((table) => {
    const columns = runLocalJson(`PRAGMA table_info('${table}')`).map((row) => row.name);
    const rows = runLocalJson(`SELECT * FROM ${table}`);
    if (!columns.length) return;
    const insertSql = buildInsert(table, columns, rows);
    if (insertSql) {
      lines.push(insertSql);
    }
  });

  const outputPath = resolve(OUTPUT_PATH);
  writeFileSync(outputPath, lines.join("\n") + "\n", "utf8");
  runWrangler([
    "d1",
    "execute",
    DB_NAME,
    "--remote",
    "--file",
    outputPath,
    "--config",
    CONFIG_PATH,
  ]);
  console.log(`Remote D1 seeded from local. SQL: ${outputPath}`);
}

main();
