import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("dist");

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

async function validateFile(filePath) {
  const html = await readFile(filePath, "utf8");
  const blocks = extractJsonLdBlocks(html);
  for (const block of blocks) {
    if (!block) continue;
    if (block.includes("{organizationJson}") || block.includes("{breadcrumbJson}") || block.includes("{websiteJson}")) {
      throw new Error(`Unrendered JSON-LD placeholder found in ${filePath}`);
    }
    try {
      JSON.parse(block);
    } catch (error) {
      const preview = block.slice(0, 200).replace(/\s+/g, " ");
      throw new Error(`Invalid JSON-LD in ${filePath}: ${preview}`);
    }
  }
}

async function main() {
  try {
    const rootStat = await stat(root);
    if (!rootStat.isDirectory()) {
      throw new Error(`${root} is not a directory`);
    }
  } catch (error) {
    console.error(`JSON-LD validation failed: ${error.message}`);
    process.exit(1);
  }

  const files = await collectHtmlFiles(root);
  for (const file of files) {
    await validateFile(file);
  }
  console.log(`JSON-LD validation passed (${files.length} HTML files).`);
}

main().catch((error) => {
  console.error(`JSON-LD validation failed: ${error.message}`);
  process.exit(1);
});
