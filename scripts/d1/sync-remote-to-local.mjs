import { spawnSync, execSync } from "node:child_process";
import { writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const DB_NAME = "heerawalla";
const CONFIG_PATH = "workers/herawalla-email-atelier/wrangler.toml";
const OUTPUT_PATH = "scripts/d1/seed/remote_dump.sql";
const D1_PERSIST_DIR = "workers/herawalla-email-atelier/.wrangler/state/v3";
const MIGRATIONS_DIR = "workers/herawalla-email-atelier/migrations";
const TABLES = [
  "catalog_items",
  "catalog_media",
  "media_library",
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

function isGitBash() {
  return Boolean(process.env.MSYSTEM || process.env.SHELL?.includes("bash")) && process.platform === "win32";
}

function normalizePathForWrangler(path) {
  if (isGitBash()) {
    if (path.startsWith('/')) {
      const match = path.match(/^\/([a-zA-Z])\/(.*)/);
      if (match) {
        const drive = match[1].toUpperCase();
        const rest = match[2].replace(/\//g, '\\');
        return `${drive}:\\${rest}`;
      }
    }
  }
  return path;
}

function runWrangler(args) {
  const isWin = process.platform === "win32";
  const gitBash = isGitBash();
  const npxBin = process.env.NPX_BIN || "npx";
  
  if (gitBash) {
    const fullCommand = `${npxBin} wrangler ${args.map(arg => `"${arg}"`).join(' ')}`;
    try {
      return execSync(fullCommand, { 
        encoding: "utf8", 
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch (error) {
      throw error;
    }
  } else if (isWin) {
    const command = process.env.ComSpec || "cmd.exe";
    const quotedArgs = args.map(arg => `"${arg}"`).join(' ');
    const commandArgs = ["/c", `${npxBin} wrangler ${quotedArgs}`];
    const result = spawnSync(command, commandArgs, { 
      encoding: "utf8", 
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const error = new Error(result.stderr || result.stdout || "wrangler_failed");
      error.stdout = result.stdout;
      error.stderr = result.stderr;
      error.status = result.status;
      throw error;
    }
    
    return result.stdout.trim();
  } else {
    const command = npxBin;
    const commandArgs = ["wrangler", ...args];
    const result = spawnSync(command, commandArgs, { 
      encoding: "utf8", 
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const error = new Error(result.stderr || result.stdout || "wrangler_failed");
      error.stdout = result.stdout;
      error.stderr = result.stderr;
      error.status = result.status;
      throw error;
    }
    
    return result.stdout.trim();
  }
}

function runRemoteQuery(command) {
  const tmpPath = resolve(tmpdir(), `d1-remote-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(tmpPath, command + ";\n", "utf8");
  
  const configPath = normalizePathForWrangler(CONFIG_PATH);
  const filePath = normalizePathForWrangler(tmpPath);
  
  try {
    console.log(`Running query: ${command}`);
    const output = runWrangler([
      "d1",
      "execute",
      DB_NAME,
      "--remote",
      "--json",
      "--file",
      filePath,
      "--config",
      configPath,
    ]);
    
    const jsonStart = output.indexOf("{");
    const jsonArrayStart = output.indexOf("[");
    const start =
      jsonStart === -1
        ? jsonArrayStart
        : jsonArrayStart === -1
          ? jsonStart
          : Math.min(jsonStart, jsonArrayStart);
    if (start === -1) {
      console.error("No JSON found in wrangler output.");
      return [];
    }
    const jsonText = output.slice(start).trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError.message);
      console.error("Output sample:", jsonText.substring(0, 500));
      return [];
    }
    
    // The structure seems to be: [{ results: [...], success: true, ... }]
    if (Array.isArray(parsed) && parsed.length > 0) {
      const entry = parsed[0];
      
      if (entry?.error?.text?.includes("no such table")) {
        return [];
      }
      if (!entry.success) {
        console.error("Query failed:", entry.error || entry);
        return [];
      }
      
      // Check if this is query metadata or actual results
      if (entry.results && entry.results.length > 0) {
        const firstResult = entry.results[0];
        
        // Check if this looks like query metadata (has "Total queries executed")
        if (firstResult["Total queries executed"] !== undefined) {
          return [];
        } else {
          // This is actual data
          return entry.results;
        }
      }
    }
    
    return [];
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

function getTableSchema(table) {
  console.log(`\n=== Getting schema for ${table} ===`);
  
  // First, let's try to get schema information using different approaches
  const approaches = [
    `PRAGMA table_info('${table}')`,
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`,
    `SELECT * FROM ${table} LIMIT 0`  // Get 0 rows to see column names in metadata
  ];
  
  for (const query of approaches) {
    console.log(`Trying: ${query}`);
    const results = runRemoteQuery(query);
    
    if (results && results.length > 0) {
      console.log(`Results from ${query}:`, results);
      
      if (query.includes('table_info')) {
        // Extract column names from PRAGMA table_info results
        const columns = results.map(row => row.name || row.Name || row.NAME);
        if (columns.length > 0 && columns[0]) {
          console.log(`Found columns via PRAGMA: ${columns.join(', ')}`);
          return columns;
        }
      } else if (query.includes('sqlite_master')) {
        // Parse CREATE TABLE statement
        const createSql = results[0]?.sql;
        if (createSql) {
          console.log(`CREATE TABLE SQL: ${createSql}`);
          // Parse column names from CREATE TABLE
          const match = createSql.match(/CREATE TABLE [^\(]+\(([^)]+)\)/);
          if (match) {
            const columnDefs = match[1].split(',').map(def => def.trim().split(' ')[0].replace(/["`\[\]]/g, ''));
            console.log(`Parsed columns: ${columnDefs.join(', ')}`);
            return columnDefs;
          }
        }
      } else if (results[0]) {
        // Get column names from the first (empty) result
        const columns = Object.keys(results[0]);
        if (columns.length > 0) {
          console.log(`Found columns via empty query: ${columns.join(', ')}`);
          return columns;
        }
      }
    }
  }
  
  // If all else fails, try to guess columns by getting 1 row
  console.log(`Trying to get 1 row from ${table} to infer columns...`);
  const sampleRow = runRemoteQuery(`SELECT * FROM ${table} LIMIT 1`);
  
  if (sampleRow && sampleRow.length > 0 && sampleRow[0]) {
    const columns = Object.keys(sampleRow[0]);
    // Filter out metadata columns
    const dataColumns = columns.filter(col => 
      !['Total queries executed', 'Rows read', 'Rows written', 'Database size (MB)'].includes(col)
    );
    
    if (dataColumns.length > 0) {
      console.log(`Inferred columns from sample: ${dataColumns.join(', ')}`);
      return dataColumns;
    }
  }
  
  console.log(`Could not determine schema for ${table}`);
  return [];
}

function getTableData(table, columns) {
  if (!columns || columns.length === 0) {
    console.log(`No columns for ${table}, skipping data fetch`);
    return [];
  }
  
  console.log(`Fetching data from ${table}...`);
  
  // Try different approaches to get actual data
  const columnList = columns.join(', ');
  const queries = [
    `SELECT ${columnList} FROM ${table}`,
    `SELECT * FROM ${table}`
  ];
  
  for (const query of queries) {
    console.log(`Trying query: ${query}`);
    const results = runRemoteQuery(query);
    
    if (results && results.length > 0) {
      // Filter out metadata rows
      const dataRows = results.filter(row => {
        // Check if this looks like a metadata row
        return !row['Total queries executed'] && !row['Rows read'] && !row['Rows written'] && !row['Database size (MB)'];
      });
      
      if (dataRows.length > 0) {
        console.log(`Found ${dataRows.length} data rows for ${table}`);
        if (dataRows.length > 0) {
          console.log(`First row sample:`, JSON.stringify(dataRows[0], null, 2).substring(0, 300));
        }
        return dataRows;
      } else {
        console.log(`Query returned only metadata, no actual data`);
      }
    }
  }
  
  console.log(`No data found for ${table}`);
  return [];
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  
  // Handle strings - escape single quotes and truncate if too long
  let text = String(value);
  if (text.length > 10000) {
    console.warn(`Truncating very long value from ${text.length} to 10000 chars`);
    text = text.substring(0, 10000);
  }
  text = text.replace(/'/g, "''");
  return `'${text}'`;
}

function buildInsert(table, columns, rows) {
  if (!rows.length) return "";
  
  console.log(`Building INSERT for ${table} with ${columns.length} columns and ${rows.length} rows`);
  
  const statements = rows.map((row) => {
    const values = columns.map((col) => {
      const value = row[col];
      return sqlValue(value);
    });
    return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  });
  
  return statements.join("\n");
}

function main() {
  const lines = [
    "PRAGMA foreign_keys = OFF;",
    ...TABLES.map((table) => `DELETE FROM ${table};`),
    "",
  ];

  TABLES.forEach((table) => {
    try {
      const columns = getTableSchema(table);
      
      if (!columns.length) {
        console.log(`  No columns found for ${table}, skipping.`);
        return;
      }
      
      const rows = getTableData(table, columns);
      
      if (rows.length > 0) {
        const insertSql = buildInsert(table, columns, rows);
        if (insertSql) {
          lines.push(`-- ${table}`);
          lines.push(insertSql);
          lines.push("");
        }
      }
    } catch (error) {
      console.error(`Error processing table ${table}:`, error.message);
    }
  });

  lines.push("PRAGMA foreign_keys = ON;");
  
  const outputPath = resolve(OUTPUT_PATH);
  const outputPathForWrangler = normalizePathForWrangler(outputPath);
  const persistPath = normalizePathForWrangler(D1_PERSIST_DIR);
  const configPath = normalizePathForWrangler(CONFIG_PATH);
  
  console.log(`\nWriting SQL to ${outputPath}...`);
  const sqlContent = lines.join("\n") + "\n";
  writeFileSync(outputPath, sqlContent, "utf8");
  
  console.log("SQL content preview:");
  console.log(sqlContent.substring(0, 1000));
  
  console.log(`\nApplying to local D1...`);
  try {
    applyMigrations(persistPath, configPath);
    runWrangler([
      "d1",
      "execute",
      DB_NAME,
      "--local",
      "--persist-to",
      persistPath,
      "--file",
      outputPathForWrangler,
      "--config",
      configPath,
    ]);
    console.log(`✅ Local D1 seeded from remote. SQL saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Failed to apply to local D1:`, error.message);
    console.log(`SQL file was still generated at: ${outputPath}`);
    
    // Try a simpler approach - maybe we need to apply SQL in chunks
    console.log("\nTrying to apply SQL in smaller chunks...");
    applySqlInChunks(sqlContent, outputPathForWrangler, persistPath, configPath);
  }
}

function applySqlInChunks(sqlContent, outputPath, persistPath, configPath) {
  // Split SQL by semicolons and apply in reasonable chunks
  const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
  
  console.log(`Found ${statements.length} SQL statements to apply`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim() + ';';
    
    if (stmt.includes('INSERT INTO')) {
      console.log(`Applying statement ${i + 1}/${statements.length}: ${stmt.substring(0, 100)}...`);
    } else {
      console.log(`Applying statement ${i + 1}/${statements.length}: ${stmt}`);
    }
    
    try {
      const tmpPath = resolve(tmpdir(), `d1-chunk-${Date.now()}-${i}.sql`);
      writeFileSync(tmpPath, stmt, "utf8");
      
      const tmpPathForWrangler = normalizePathForWrangler(tmpPath);
      
      runWrangler([
        "d1",
        "execute",
        DB_NAME,
        "--local",
        "--persist-to",
        persistPath,
        "--file",
        tmpPathForWrangler,
        "--config",
        configPath,
      ]);
      
      unlinkSync(tmpPath);
      console.log(`  ✅ Success`);
    } catch (error) {
      console.error(`  ❌ Failed:`, error.message);
      console.log(`  Statement that failed: ${stmt.substring(0, 200)}`);
    }
  }
}

function applyMigrations(persistPath, configPath) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  if (!files.length) {
    console.log("No migrations found, skipping schema setup.");
    return;
  }
  console.log(`Applying ${files.length} migrations to local D1...`);
  for (const file of files) {
    const filePath = resolve(MIGRATIONS_DIR, file);
    const filePathForWrangler = normalizePathForWrangler(filePath);
    console.log(`  -> ${file}`);
    runWrangler([
      "d1",
      "execute",
      DB_NAME,
      "--local",
      "--persist-to",
      persistPath,
      "--file",
      filePathForWrangler,
      "--config",
      configPath,
    ]);
  }
}

try {
  main();
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
