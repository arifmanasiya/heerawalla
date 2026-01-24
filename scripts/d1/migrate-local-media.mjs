import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const CONFIG_PATH = "workers/herawalla-email-atelier/wrangler.toml";
const DB_NAME = "heerawalla";
const MEDIA_DIR = "public/images";
const OUTPUT_SQL = "scripts/d1/seed/local_media_migration.sql";
const D1_PERSIST_DIR = ".wrangler/state/v3";
const PERSIST_DIR = ".wrangler/state/v3";
const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg"]);
const args = new Set(process.argv.slice(2));
const useLocal = args.has("--local") || !args.has("--remote");
const useRemote = args.has("--remote") || !args.has("--local");
const limitArgIndex = process.argv.indexOf("--limit");
const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : 0;

function runCommand(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getMediaBaseUrl({ localOnly }) {
  const envLocal = process.env.MEDIA_PUBLIC_BASE_URL_LOCAL;
  const envBase = process.env.MEDIA_PUBLIC_BASE_URL;
  if (localOnly && envLocal) return envLocal.trim().replace(/\/+$/, "");
  if (envBase) return envBase.trim().replace(/\/+$/, "");
  const toml = readFileSync(CONFIG_PATH, "utf8");
  if (localOnly) {
    const localMatch = toml.match(/MEDIA_PUBLIC_BASE_URL_LOCAL\s*=\s*"([^"]+)"/);
    if (localMatch) return localMatch[1].trim().replace(/\/+$/, "");
  }
  const match = toml.match(/MEDIA_PUBLIC_BASE_URL\s*=\s*"([^"]+)"/);
  return match ? match[1].trim().replace(/\/+$/, "") : "";
}

function getBucketConfig() {
  const toml = readFileSync(CONFIG_PATH, "utf8");
  const bucketMatch = toml.match(/bucket_name\s*=\s*"([^"]+)"/);
  const remote = bucketMatch?.[1] || "heerawalla-products";
  const local = remote;
  return { local, remote };
}

function listFiles(root) {
  const results = [];
  const entries = readdirSync(root, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(fullPath));
      return;
    }
    results.push(fullPath);
  });
  return results;
}

function readText(path) {
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return "";
  }
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

function extractSortOrder(name) {
  const match = name.match(/(\\d+)(?!.*\\d)/);
  return match ? Number(match[1]) : 0;
}

function resolvePosition(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("hero")) return "hero";
  if (normalized.includes("ring")) return "ring";
  if (normalized.includes("bracelet")) return "bracelet";
  if (normalized.includes("bangle")) return "bangle";
  if (normalized.includes("earring")) return "earring";
  if (normalized.includes("pendant")) return "pendant";
  if (normalized.includes("nose")) return "nose-pin";
  if (normalized.includes("set")) return "set";
  if (normalized.includes("band")) return "band";
  return "";
}

function buildMediaId(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const withoutExt = normalized.replace(/\.[a-z0-9]+$/i, "");
  return withoutExt.split("/").filter(Boolean).join("_");
}

function buildLabel(baseName) {
  if (!baseName) return "";
  if (baseName.startsWith("img-")) return baseName.slice(4);
  return baseName;
}

function fetchCatalogItems() {
  const queryPath = "scripts/d1/seed/tmp_catalog_items.sql";
  writeFileSync(queryPath, "SELECT id, slug, type FROM catalog_items;", "utf8");
  const output = runCommand(
    `npx wrangler d1 execute ${DB_NAME} --local --json --file ${queryPath} --persist-to ${D1_PERSIST_DIR} --config ${CONFIG_PATH}`
  );
  const parsed = JSON.parse(output);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  return entry?.results || [];
}

function uploadToR2(bucketName, key, filePath, mode) {
  const isLocal = mode === "local";
  const isRemote = mode === "remote";
  console.log(`Uploading ${mode} -> ${bucketName}/${key}`);
  const command = [
    "npx",
    "wrangler",
    "r2",
    "object",
    "put",
    `${bucketName}/${key}`,
    "--file",
    `"${filePath}"`,
    isLocal ? "--local" : "",
    isRemote ? "--remote" : "",
    isLocal ? "--persist-to" : "",
    isLocal ? `"${PERSIST_DIR}"` : "",
    "--config",
    CONFIG_PATH,
  ]
    .filter(Boolean)
    .join(" ");
  let attempts = 0;
  while (attempts < 3) {
    attempts += 1;
    try {
      runCommand(command);
      return true;
    } catch (error) {
      if (attempts >= 3) {
        console.warn(`R2 upload failed after retries: ${key}`);
        return false;
      }
      sleep(250);
    }
  }
  return false;
}

function main() {
  const mediaBaseUrl = getMediaBaseUrl({ localOnly: useLocal && !useRemote });
  if (!mediaBaseUrl) {
    throw new Error("MEDIA_PUBLIC_BASE_URL not found. Set it in env or wrangler.toml.");
  }
  const buckets = getBucketConfig();

  console.log(`Mode: ${useLocal ? "local" : ""}${useLocal && useRemote ? "+" : ""}${useRemote ? "remote" : ""}`);
  if (limit > 0) {
    console.log(`Limiting to first ${limit} files per section.`);
  }

  const catalogItems = fetchCatalogItems();
  const catalogById = new Map(catalogItems.map((item) => [String(item.id), item]));

  const sqlLines = [
    "PRAGMA foreign_keys = OFF;",
    "DELETE FROM catalog_media;",
    "DELETE FROM media_library;",
    "PRAGMA foreign_keys = ON;",
  ];

  const productBase = join(MEDIA_DIR, "products");
  const productFiles = listFiles(productBase).filter((file) => {
    const ext = extname(file).toLowerCase();
    return ALLOWED_EXTS.has(ext);
  });
  const productSlice = limit > 0 ? productFiles.slice(0, limit) : productFiles;
  console.log(`Product images: ${productFiles.length}`);

  productSlice.forEach((filePath) => {
    const relPath = relative(productBase, filePath);
    const parts = relPath.split(/[\\/]/);
    if (parts.length < 2) return;
    const catalogId = parts[parts.length - 2];
    const catalog = catalogById.get(catalogId);
    if (!catalog || catalog.type !== "product") return;

    const ext = extname(filePath).toLowerCase();
    const baseName = basename(filePath, ext);
    const mediaRelPath = relative(MEDIA_DIR, filePath);
    const mediaId = buildMediaId(mediaRelPath);
    const key = `media/library/${mediaId}${ext}`;
    const description = readText(join(productBase, parts.slice(0, -1).join("/"), `${baseName}.txt`));
    const label = buildLabel(baseName);
    const alt = description || label;
    const url = `${mediaBaseUrl}/${key}`;
    const position = resolvePosition(baseName);
    const sortOrder = extractSortOrder(baseName);
    const isPrimary = position === "hero" ? 1 : 0;

    console.log(`Media ${mediaId} -> catalog ${catalogId}`);
    if (useLocal) {
      const uploaded = uploadToR2(buckets.local, key, filePath, "local");
      if (!uploaded) return;
    }
    if (useRemote) {
      const uploaded = uploadToR2(buckets.remote, key, filePath, "remote");
      if (!uploaded) return;
    }

    sqlLines.push(
      "INSERT INTO media_library (media_id, url, media_type, label, alt, description, created_at) VALUES (" +
        [
          sqlValue(mediaId),
          sqlValue(url),
          sqlValue("image"),
          sqlValue(label),
          sqlValue(alt),
          sqlValue(description),
          "datetime('now')",
        ].join(", ") +
        ") ON CONFLICT(media_id) DO UPDATE SET url = excluded.url, media_type = excluded.media_type, label = excluded.label, alt = excluded.alt, description = excluded.description;"
    );

    sqlLines.push(
      "INSERT INTO catalog_media (catalog_id, media_id, position, is_primary, sort_order) VALUES (" +
        [
          sqlValue(catalogId),
          sqlValue(mediaId),
          sqlValue(position),
          sqlValue(isPrimary),
          sqlValue(sortOrder),
        ].join(", ") +
        ");"
    );

  });

  const inspirationBase = join(MEDIA_DIR, "inspirations");
  const inspirationFiles = listFiles(inspirationBase).filter((file) => {
    const ext = extname(file).toLowerCase();
    return ALLOWED_EXTS.has(ext);
  });
  const inspirationSlice = limit > 0 ? inspirationFiles.slice(0, limit) : inspirationFiles;
  console.log(`Inspiration images: ${inspirationFiles.length}`);

  inspirationSlice.forEach((filePath) => {
    const ext = extname(filePath).toLowerCase();
    const baseName = basename(filePath, ext);
    const catalogId = baseName;
    const catalog = catalogById.get(catalogId);
    if (!catalog || catalog.type !== "inspiration") return;

    const relPath = relative(MEDIA_DIR, filePath);
    const mediaId = buildMediaId(relPath);
    const key = `media/library/${mediaId}${ext}`;
    const description = readText(join(inspirationBase, `${baseName}.txt`));
    const label = buildLabel(baseName);
    const alt = description || label;
    const url = `${mediaBaseUrl}/${key}`;
    const position = "hero";
    const sortOrder = 0;

    console.log(`Media ${mediaId} -> inspiration ${catalogId}`);
    if (useLocal) {
      const uploaded = uploadToR2(buckets.local, key, filePath, "local");
      if (!uploaded) return;
    }
    if (useRemote) {
      const uploaded = uploadToR2(buckets.remote, key, filePath, "remote");
      if (!uploaded) return;
    }

    sqlLines.push(
      "INSERT INTO media_library (media_id, url, media_type, label, alt, description, created_at) VALUES (" +
        [
          sqlValue(mediaId),
          sqlValue(url),
          sqlValue("image"),
          sqlValue(label),
          sqlValue(alt),
          sqlValue(description),
          "datetime('now')",
        ].join(", ") +
        ") ON CONFLICT(media_id) DO UPDATE SET url = excluded.url, media_type = excluded.media_type, label = excluded.label, alt = excluded.alt, description = excluded.description;"
    );

    sqlLines.push(
      "INSERT INTO catalog_media (catalog_id, media_id, position, is_primary, sort_order) VALUES (" +
        [
          sqlValue(catalogId),
          sqlValue(mediaId),
          sqlValue(position),
          sqlValue(1),
          sqlValue(sortOrder),
        ].join(", ") +
        ");"
    );

  });

  writeFileSync(OUTPUT_SQL, sqlLines.join("\n") + "\n", "utf8");
  if (useLocal) {
    console.log("Seeding local D1 with media_library/catalog_media.");
    runCommand(
      `npx wrangler d1 execute ${DB_NAME} --local --file ${OUTPUT_SQL} --persist-to ${D1_PERSIST_DIR} --config ${CONFIG_PATH}`
    );
  }
  if (useRemote) {
    console.log("Seeding remote D1 with media_library/catalog_media.");
    runCommand(
      `npx wrangler d1 execute ${DB_NAME} --remote --file ${OUTPUT_SQL} --config ${CONFIG_PATH}`
    );
  }

  console.log(`Media migration complete. SQL: ${OUTPUT_SQL}`);
}

main();
