#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync, execSync } from "node:child_process";

const DB_NAME = "heerawalla";
const CONFIG_PATH = "workers/herawalla-email-atelier/wrangler.toml";
const PERSIST_DIR = "workers/herawalla-email-atelier/.wrangler/state/v3";
const PERSIST_D1_DIR = join(PERSIST_DIR, "d1");
const OUTPUT_PATH = "scripts/d1/seed/remote_dump_full.sql";
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

function isGitBash() {
  return Boolean(process.env.MSYSTEM || process.env.SHELL?.includes("bash")) && process.platform === "win32";
}

function toWindowsPath(posixPath) {
  if (!posixPath) return posixPath;
  if (posixPath.startsWith('/')) {
    const match = posixPath.match(/^\/([a-zA-Z])\/(.*)/);
    if (match) {
      const drive = match[1].toUpperCase();
      const rest = match[2].replace(/\//g, '\\');
      return `${drive}:\\${rest}`;
    }
  }
  return posixPath;
}

function toPosixPath(winPath) {
  if (!winPath) return winPath;
  if (/^[A-Za-z]:\\/.test(winPath)) {
    const drive = winPath[0].toLowerCase();
    const rest = winPath.slice(2).replace(/\\/g, "/");
    return `/${drive}${rest}`;
  }
  return winPath.replace(/\\/g, "/");
}

function normalizePathForPlatform(path) {
  if (isGitBash()) {
    // When running in Git Bash, we need to convert to Windows paths for npx.cmd
    return toWindowsPath(path);
  }
  return path;
}

function runWrangler(args) {
  const isWin = process.platform === "win32";
  const gitBash = isGitBash();
  
  if (gitBash) {
    // In Git Bash, use execSync with proper quoting for Windows
    const command = `npx.cmd wrangler ${args.map(arg => `"${arg}"`).join(' ')}`;
    console.log(`Running in Git Bash: ${command}`);
    
    try {
      return execSync(command, {
        encoding: "utf8",
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      }).trim();
    } catch (error) {
      console.error("execSync error:", error.message);
      throw error;
    }
  } else if (isWin) {
    // Regular Windows CMD/PowerShell
    const command = process.env.ComSpec || "cmd.exe";
    const escapedArgs = args.map(arg => `"${arg}"`).join(' ');
    const fullCommand = `npx.cmd wrangler ${escapedArgs}`;
    
    console.log(`Running on Windows: ${fullCommand}`);
    
    const result = spawnSync(command, ['/c', fullCommand], {
      encoding: "utf8",
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    
    if (result.error) {
      console.error("Spawn error:", result.error);
      throw result.error;
    }
    
    if (result.status !== 0) {
      console.error("Command stderr:", result.stderr);
      console.error("Command stdout:", result.stdout);
      throw new Error(result.stderr || result.stdout || "wrangler_failed");
    }
    
    return result.stdout.trim();
  } else {
    // Unix/Linux/Mac
    const command = "npx";
    const commandArgs = ["wrangler", ...args];
    
    console.log(`Running on Unix: ${command} ${commandArgs.join(' ')}`);
    
    const result = spawnSync(command, commandArgs, {
      encoding: "utf8",
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "wrangler_failed");
    }
    
    return result.stdout.trim();
  }
}

function readDatabaseId() {
  try {
    const raw = readFileSync(resolve(CONFIG_PATH), "utf8");
    const match = raw.match(/database_id\s*=\s*"([^"]+)"/);
    if (!match) throw new Error(`database_id not found in ${CONFIG_PATH}`);
    return match[1];
  } catch (error) {
    console.error(`Failed to read config file: ${CONFIG_PATH}`);
    throw error;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${text}`);
  }
  return response.json();
}

async function runRemoteQuery(command, databaseId) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${databaseId}/query`;
  try {
    console.log(`Running remote query: ${command.substring(0, 100)}...`);
    const data = await fetchJson(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: command }),
    });
    if (!data.success) {
      const errorText = data.errors?.[0]?.message || data.errors?.[0]?.text || JSON.stringify(data.errors);
      throw new Error(errorText || "remote_query_failed");
    }
    return data.result?.[0]?.results || [];
  } catch (error) {
    const message = error?.message || String(error);
    if (message.includes("SQLITE_AUTH") || message.includes("not authorized") || message.includes("403")) {
      console.warn("⚠️  D1 API auth failed, falling back to wrangler --remote...");
      return runRemoteQueryViaWrangler(command);
    }
    throw error;
  }
}

function parseWranglerJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function runRemoteQueryViaWrangler(command) {
  const configPath = normalizePathForPlatform(CONFIG_PATH);
  const sqlPath = resolve(tmpdir(), `d1-remote-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(sqlPath, command, "utf8");
  const sqlArg = normalizePathForPlatform(sqlPath);
  
  console.log(`Running via wrangler: ${command.substring(0, 100)}...`);
  
  const result = runWrangler([
    "d1",
    "execute",
    DB_NAME,
    "--remote",
    "--json",
    "--file",
    sqlArg,
    "--config",
    configPath,
  ]);
  
  rmSync(sqlPath, { force: true });
  const parsed = parseWranglerJson(result);
  if (!parsed) {
    console.error("Wrangler output:", result.substring(0, 500));
    throw new Error(`wrangler_remote_parse_failed`);
  }
  
  const row = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!row?.success) {
    const errorText = row?.error?.text || row?.error?.message || JSON.stringify(row?.error || row);
    throw new Error(errorText || "wrangler_remote_failed");
  }
  
  // IMPORTANT: Check if we're getting actual data or just metadata
  if (row.results && row.results.length > 0) {
    const firstResult = row.results[0];
    // Filter out metadata rows (query statistics)
    if (firstResult["Total queries executed"] !== undefined) {
      console.warn("⚠️  Query returned metadata instead of data");
      console.log("Metadata:", firstResult);
      return []; // Return empty array since we got metadata, not actual data
    }
  }
  
  return row.results || [];
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "string") {
    // Handle BLOBs or large text
    if (value.includes('\x00') || value.length > 10000) {
      console.warn(`Large or binary value detected (${value.length} chars), using hex encoding`);
      return `X'${Buffer.from(value).toString('hex')}'`;
    }
    const escaped = value.replace(/'/g, "''").replace(/\\/g, "\\\\");
    return `'${escaped}'`;
  }
  // For objects/arrays, JSON.stringify them
  try {
    const jsonStr = JSON.stringify(value);
    const escaped = jsonStr.replace(/'/g, "''").replace(/\\/g, "\\\\");
    return `'${escaped}'`;
  } catch {
    return "NULL";
  }
}

function buildInsert(table, columns, rows) {
  if (!rows.length) return "";
  
  console.log(`Building ${rows.length} INSERTs for ${table}`);
  
  return rows
    .map((row, index) => {
      const values = columns.map((col) => {
        const value = row[col];
        return sqlValue(value);
      });
      return `INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`;
    })
    .join("\n");
}

function resetLocalDb() {
  console.log(`Clearing local D1 at: ${PERSIST_D1_DIR}`);
  rmSync(PERSIST_D1_DIR, { recursive: true, force: true });
  mkdirSync(PERSIST_D1_DIR, { recursive: true });
}

function sortTablesByDependencies(schemaRows) {
  // Simple topological sort - tables without foreign keys first
  const tables = schemaRows.filter(row => row.type === 'table');
  const createStatements = schemaRows.map(row => row.sql);
  
  // Group by table type
  const tablesToCreate = [];
  const indexesToCreate = [];
  const viewsToCreate = [];
  const triggersToCreate = [];
  
  for (const row of schemaRows) {
    if (row.sql) {
      if (row.type === 'table') tablesToCreate.push(row.sql);
      else if (row.type === 'index') indexesToCreate.push(row.sql);
      else if (row.type === 'view') viewsToCreate.push(row.sql);
      else if (row.type === 'trigger') triggersToCreate.push(row.sql);
    }
  }
  
  return [...tablesToCreate, ...indexesToCreate, ...viewsToCreate, ...triggersToCreate];
}

async function main() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error("Missing CF_ACCOUNT_ID/CLOUDFLARE_ACCOUNT_ID or CF_API_TOKEN/CLOUDFLARE_API_TOKEN.");
  }
  
  console.log("Starting remote to local D1 sync...");
  const databaseId = readDatabaseId();
  console.log(`Remote database ID: ${databaseId}`);

  console.log("Resetting local D1...");
  resetLocalDb();

  console.log("Loading remote schema...");
  const schemaRows = await runRemoteQuery(
    "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type, name",
    databaseId
  );

  console.log(`Found ${schemaRows.length} schema objects`);
  
  // Sort tables to handle dependencies
  const schemaSql = sortTablesByDependencies(schemaRows).join(";\n") + ";\n";

  console.log("Loading remote table list...");
  const tableRows = await runRemoteQuery(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    databaseId
  );
  const tables = tableRows.map((row) => row.name).filter(Boolean);
  
  console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);

  const dataSqlLines = [];
  for (const table of tables) {
    try {
      console.log(`\nProcessing table: ${table}`);
      
      // Get column information
      const columnsResult = await runRemoteQuery(`PRAGMA table_info('${table}')`, databaseId);
      const columns = columnsResult.map((row) => row.name).filter(Boolean);
      
      if (!columns.length) {
        console.log(`  No columns found, skipping`);
        continue;
      }
      
      console.log(`  Columns: ${columns.join(', ')}`);
      
      // Get data
      const rows = await runRemoteQuery(`SELECT * FROM "${table}"`, databaseId);
      console.log(`  Found ${rows.length} rows`);
      
      if (rows.length > 0) {
        const insertSql = buildInsert(table, columns, rows);
        if (insertSql) {
          dataSqlLines.push(`\n-- ${table} (${rows.length} rows)`);
          dataSqlLines.push(insertSql);
        }
      }
    } catch (error) {
      console.error(`  Error processing table ${table}:`, error.message);
    }
  }

  const sql = [
    "PRAGMA foreign_keys = OFF;",
    schemaSql,
    "\n-- Data",
    ...dataSqlLines,
    "\nPRAGMA foreign_keys = ON;",
    "VACUUM;",
    ""
  ].join("\n");

  const outputPath = resolve(OUTPUT_PATH);
  writeFileSync(outputPath, sql, "utf8");

  console.log(`\nSQL dump written to: ${outputPath}`);
  console.log(`SQL size: ${sql.length} characters`);
  
  // Show preview
  console.log("\nFirst 1000 chars of SQL:");
  console.log(sql.substring(0, 1000));

  console.log(`\nApplying dump to local D1...`);
  const configPath = normalizePathForPlatform(CONFIG_PATH);
  const outputPathArg = normalizePathForPlatform(outputPath);
  const persistPath = normalizePathForPlatform(PERSIST_DIR);

  try {
    // First, let's test if wrangler works with a simple command
    console.log("Testing wrangler...");
    const testResult = runWrangler(["--version"]);
    console.log("Wrangler version test passed:", testResult.substring(0, 100));
    
    // Now apply the SQL file
    console.log(`Applying SQL file: ${outputPathArg}`);
    console.log(`Persist directory: ${persistPath}`);
    console.log(`Config file: ${configPath}`);
    
    runWrangler([
      "d1",
      "execute",
      DB_NAME,
      "--local",
      "--persist-to",
      persistPath,
      "--file",
      outputPathArg,
      "--config",
      configPath,
    ]);
    console.log("✅ Local D1 initialized from remote.");
  } catch (error) {
    console.error("❌ Failed to apply SQL to local D1:", error.message);
    console.log("\nYou can try to apply the SQL manually with one of these commands:");
    console.log(`\nOption 1 (PowerShell/CMD):`);
    console.log(`npx.cmd wrangler d1 execute ${DB_NAME} --local --persist-to "${PERSIST_DIR}" --file "${outputPath}" --config "${CONFIG_PATH}"`);
    
    console.log(`\nOption 2 (Git Bash):`);
    const gitBashCmd = `npx.cmd wrangler d1 execute ${DB_NAME} --local --persist-to "${toWindowsPath(PERSIST_DIR)}" --file "${toWindowsPath(outputPath)}" --config "${toWindowsPath(CONFIG_PATH)}"`;
    console.log(gitBashCmd);
    
    console.log(`\nOption 3 (Apply in chunks):`);
    console.log("The SQL file is available at:", outputPath);
    console.log("You can split it into smaller files and apply them individually.");
    
    // Try to apply SQL in smaller chunks using the manual command
    console.log("\nTrying to apply SQL in smaller chunks...");
    applySqlInChunks(sql, outputPath, persistPath, configPath);
  }
}

function applySqlInChunks(sqlContent, outputPath, persistPath, configPath) {
  // Split SQL by statements
  const statements = [];
  let currentStatement = "";
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const nextChar = i + 1 < sqlContent.length ? sqlContent[i + 1] : '';
    
    // Handle string literals
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      currentStatement += char;
    } else if (inString && char === stringChar && nextChar !== stringChar) {
      inString = false;
      currentStatement += char;
    } else if (inString && char === stringChar && nextChar === stringChar) {
      // Escaped quote
      currentStatement += char + nextChar;
      i++; // Skip next char
    } else if (!inString && char === ';') {
      // End of statement
      currentStatement += char;
      statements.push(currentStatement.trim());
      currentStatement = "";
    } else {
      currentStatement += char;
    }
  }
  
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`Split into ${statements.length} statements`);
  
  // Apply statements in batches, but using the direct approach for Git Bash
  const batchSize = 10; // Smaller batch size
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, i + batchSize);
    const batchSql = batch.join("\n");
    const batchPath = resolve(tmpdir(), `d1-batch-${Math.floor(i / batchSize)}.sql`);
    
    writeFileSync(batchPath, batchSql, "utf8");
    
    // For Git Bash, we need to use the Windows path
    const batchPathForCmd = normalizePathForPlatform(batchPath);
    
    console.log(`\nApplying batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(statements.length / batchSize)} (statements ${i + 1}-${Math.min(i + batchSize, statements.length)})`);
    
    if (isGitBash()) {
      // For Git Bash, construct and execute the command directly
      const cmd = `npx.cmd wrangler d1 execute ${DB_NAME} --local --persist-to "${persistPath}" --file "${batchPathForCmd}" --config "${configPath}"`;
      console.log(`Running: ${cmd}`);
      
      try {
        const result = execSync(cmd, {
          encoding: "utf8",
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true
        }).trim();
        console.log(`  ✅ Batch applied successfully`);
      } catch (error) {
        console.error(`  ❌ Batch failed:`, error.message);
        
        // If batch fails, try each statement individually
        for (let j = 0; j < batch.length; j++) {
          const stmt = batch[j];
          const singleStmtPath = resolve(tmpdir(), `d1-stmt-${i + j}.sql`);
          writeFileSync(singleStmtPath, stmt, "utf8");
          const singleStmtPathForCmd = normalizePathForPlatform(singleStmtPath);
          
          const singleCmd = `npx.cmd wrangler d1 execute ${DB_NAME} --local --persist-to "${persistPath}" --file "${singleStmtPathForCmd}" --config "${configPath}"`;
          
          console.log(`    Statement ${i + j + 1}/${statements.length}: ${stmt.substring(0, 100)}...`);
          try {
            execSync(singleCmd, {
              encoding: "utf8",
              shell: true,
              stdio: ['pipe', 'pipe', 'pipe'],
              windowsHide: true
            });
            console.log(`      ✅ Success`);
          } catch (stmtError) {
            console.error(`      ❌ Failed:`, stmtError.message);
            console.log(`      SQL: ${stmt.substring(0, 200)}`);
          } finally {
            rmSync(singleStmtPath, { force: true });
          }
        }
      }
    } else {
      // For regular Windows or Unix, use runWrangler
      try {
        runWrangler([
          "d1",
          "execute",
          DB_NAME,
          "--local",
          "--persist-to",
          persistPath,
          "--file",
          batchPathForCmd,
          "--config",
          configPath,
        ]);
        console.log(`  ✅ Batch applied successfully`);
      } catch (error) {
        console.error(`  ❌ Batch failed:`, error.message);
      }
    }
    
    rmSync(batchPath, { force: true });
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});