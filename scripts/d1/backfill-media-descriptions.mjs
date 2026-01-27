#!/usr/bin/env node
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const DEFAULT_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const DEFAULT_CONFIG = 'workers/herawalla-email-atelier/wrangler.toml';
const execFileAsync = promisify(execFile);

const args = new Set(process.argv.slice(2));
const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
};

const configPath = getArgValue('--config') || DEFAULT_CONFIG;
const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const model = process.env.CF_AI_MODEL || DEFAULT_MODEL;
const limit = Number(getArgValue('--limit') || '0');
const slugFilter = getArgValue('--slug');
const commit = args.has('--commit');
const useLocal = args.has('--local');

if (!useLocal && (!accountId || !apiToken)) {
  console.error('Missing CF_ACCOUNT_ID/CLOUDFLARE_ACCOUNT_ID or CF_API_TOKEN/CLOUDFLARE_API_TOKEN.');
  process.exit(1);
}

const readDatabaseId = async () => {
  const raw = await readFile(resolve(configPath), 'utf8');
  const match = raw.match(/database_id\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`database_id not found in ${configPath}`);
  }
  return match[1];
};

const readDatabaseName = async () => {
  const raw = await readFile(resolve(configPath), 'utf8');
  const match = raw.match(/database_name\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`database_name not found in ${configPath}`);
  }
  return match[1];
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${text}`);
  }
  return response.json();
};

const queryD1Remote = async (databaseId, sql, params = []) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const body = { sql, params };
  const data = await fetchJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result?.[0]?.results || [];
};

const normalizeWindowsPath = (value) => {
  if (!value) return value;
  // If already a Windows path, return as-is
  if (/^[A-Za-z]:\\/.test(value)) return value;
  // If it's a Unix-style path starting with /, convert to Windows
  if (value.startsWith('/')) {
    const drive = value[1];
    const rest = value.slice(2).replace(/\//g, '\\');
    return `${drive.toUpperCase()}:\\${rest}`;
  }
  // For npx, just return as-is
  return value;
};

const runWrangler = async (args) => {
  const npxEnv = process.env.NPX_BIN;
  const defaultWin = 'C:\\\\Progra~1\\\\nodejs\\\\npx.cmd'; // short path avoids spaces
  const npxBin =
    npxEnv ||
    (process.platform === 'win32' ? defaultWin : 'npx');

  if (process.platform === 'win32') {
    const cmdline = `${npxBin} wrangler ${args.join(' ')}`;
    const { spawn } = await import('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', cmdline], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0) return resolve({ stdout, stderr });
        const error = new Error(`Command failed with code ${code}: ${stderr || stdout}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      });
      child.on('error', reject);
    });
  }

  return execFileAsync(npxBin, ['wrangler', ...args], { maxBuffer: 10 * 1024 * 1024 });
};

const queryD1Local = async (databaseName, sql, params = []) => {
  // For local queries with params, we need to format the SQL properly
  let formattedSql = sql;
  if (params.length > 0) {
    // Simple parameter substitution for local mode
    // Note: This is not safe for production, but works for this use case
    const paramsCopy = [...params];
    formattedSql = sql.replace(/\?/g, () => {
      const param = paramsCopy.shift();
      if (typeof param === 'string') {
        return `'${param.replace(/'/g, "''")}'`;
      } else if (param === null || param === undefined) {
        return 'NULL';
      }
      return param;
    });
  }
  
  const sqlPath = resolve(tmpdir(), `d1-query-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  await writeFile(sqlPath, formattedSql);
  
  console.log('Writing SQL to:', sqlPath);
  console.log('SQL content:', formattedSql.substring(0, 500) + '...');
  
  let stdout = '';
  try {
    ({ stdout } = await runWrangler([
      'd1',
      'execute',
      databaseName,
      '--local',
      '--json',
      '--config',
      configPath,
      '--file',
      sqlPath
    ]));
  } finally {
    await unlink(sqlPath).catch((err) => {
      console.log('Note: Failed to delete temp file', sqlPath, err.message);
    });
  }
  
  console.log('Wrangler stdout:', stdout.substring(0, 500) + '...');
  
  try {
    const data = JSON.parse(stdout);
    if (!Array.isArray(data) || !data[0]?.success) {
      throw new Error(`Local D1 query failed: ${stdout}`);
    }
    return data[0].results || [];
  } catch (error) {
    // Try to parse as single object if array parse fails
    try {
      const data = JSON.parse(stdout);
      if (data && data.success && Array.isArray(data.result)) {
        return data.result[0]?.results || [];
      }
    } catch (e) {
      // If we can't parse JSON at all, check if it's an empty result
      if (stdout.trim() === '') {
        return [];
      }
      throw new Error(`Failed to parse wrangler output as JSON: ${stdout.substring(0, 200)}`);
    }
    throw error;
  }
};

const queryD1 = async (databaseId, databaseName, sql, params = []) => {
  if (useLocal) {
    return queryD1Local(databaseName, sql, params);
  }
  return queryD1Remote(databaseId, sql, params);
};

const getTableColumns = async (databaseId, databaseName, table) => {
  const rows = await queryD1(databaseId, databaseName, `PRAGMA table_info(${table});`, []);
  return new Set(rows.map((row) => String(row.name || '').trim()).filter(Boolean));
};

const buildImageCandidates = (row) => {
  const candidates = [];
  if (row.url) candidates.push(String(row.url));
  if (useLocal) {
    const base =
      (process.env.MEDIA_LIBRARY_BASE_URL || 'http://localhost:8787/media/library/').replace(
        /\/$/,
        '/'
      );
    if (row.media_id) {
      candidates.push(`${base}${row.media_id}.png`);
      candidates.push(`${base}${row.media_id}.jpeg`);
      candidates.push(`${base}${row.media_id}.jpg`);
    }
  }
  return Array.from(new Set(candidates));
};

const fetchImageAsDataUrl = async (row) => {
  const candidates = buildImageCandidates(row);
  let lastError = null;
  for (const imageUrl of candidates) {
    try {
      console.log('Fetching image:', imageUrl);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error(`Failed to fetch image ${imageUrl}:`, error.message);
      lastError = error;
    }
  }
  throw lastError || new Error('Image fetch failed.');
};

const buildPrompt = (row) => {
  const categories = safeJsonArray(row.categories);
  const tags = safeJsonArray(row.tags);
  const meta = {
    name: row.name,
    slug: row.slug,
    gender: row.gender,
    categories,
    tags,
    stoneTypes: safeJsonArray(row.stone_types || row.stone_type_options),
    stoneWeight: row.stone_weight,
    stoneWeightRange: row.stone_weight_range,
    clarity: row.clarity,
    color: row.color,
    cut: row.cut,
    mediaLabel: row.label,
    mediaAlt: row.alt
  };

  return `Write a concise 1-2 sentence product image description for Heerawalla. Use the image as primary truth and optionally weave in provided metadata if it is visually supported. Avoid brand slogans, prices, or guarantees. Keep it elegant and factual.\n\nMetadata: ${JSON.stringify(meta)}`;
};

const safeJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [trimmed];
    } catch {
      return trimmed.split('|').map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return [String(value)];
};

const ensureAgreement = async () => {
  if (ensureAgreement._done) return;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  const attempts = [
    // Chat style
    {
      body: {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'agree' }] }],
        max_tokens: 4,
        temperature: 0
      }
    },
    // Prompt style
    {
      body: { prompt: 'agree' }
    },
    // Text-only message
    {
      body: {
        messages: [{ role: 'user', content: 'agree' }],
        max_tokens: 4,
        temperature: 0
      }
    }
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      await fetchJson(url, { method: 'POST', headers, body: JSON.stringify(attempt.body) });
      ensureAgreement._done = true;
      return;
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      if (!msg.includes('Model Agreement') && !msg.includes('5016')) {
        ensureAgreement._done = true; // different error; don't loop forever
        throw err;
      }
    }
  }
  // If we’re here, agreement still not accepted
  throw lastError || new Error('Model agreement failed after multiple attempts.');
};

const callWorkersAI = async (prompt, imageDataUrl) => {
  await ensureAgreement();

  console.log('Calling Workers AI with model:', model);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const makeBody = (userContent) => ({
    messages: [
      {
        role: 'system',
        content: 'You are a product copywriter for fine jewelry. Keep the description refined and concise.'
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    max_tokens: 180,
    temperature: 0.4
  });

  const userContent = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: imageDataUrl } }
  ];

  const callOnce = async (body) =>
    fetchJson(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

  const data = await callOnce(makeBody(userContent));

  const result = data.result || {};
  const text =
    result.response ||
    result.output ||
    result.output_text ||
    result.generated_text ||
    result.text ||
    result?.choices?.[0]?.message?.content ||
    result?.message?.content;

  if (!text || typeof text !== 'string') {
    throw new Error(`Unexpected AI response: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return text.trim();
};

const main = async () => {
  const databaseId = await readDatabaseId();
  const databaseName = await readDatabaseName();
  
  console.log('Database ID:', databaseId);
  console.log('Database Name:', databaseName);
  console.log('Config Path:', configPath);
  console.log('Use Local:', useLocal);
  console.log('Commit Mode:', commit);
  
  const catalogColumns = await getTableColumns(databaseId, databaseName, 'catalog_items');
  const mediaColumns = await getTableColumns(databaseId, databaseName, 'catalog_media');
  const catalogSelectColumns = [
    'name',
    'slug',
    'gender',
    'categories',
    'tags',
    'stone_types',
    'stone_weight',
    'clarity',
    'color',
    'cut'
  ].filter((column) => catalogColumns.has(column));
  const catalogSelectSql = catalogSelectColumns.map((column) => `c.${column}`).join(',\n      ');
  const catalogTypeCol =
    mediaColumns.has('catalog_type') ? 'catalog_type' : mediaColumns.has('type') ? 'type' : null;
  const catalogSlugCol =
    mediaColumns.has('catalog_slug') ? 'catalog_slug' : mediaColumns.has('slug') ? 'slug' : null;
  const catalogIdCol = mediaColumns.has('catalog_id') ? 'catalog_id' : null;
  if (!catalogTypeCol && !catalogIdCol) {
    throw new Error(
      `catalog_media is missing expected columns. Found: ${Array.from(mediaColumns).join(', ')}`
    );
  }

  const baseSql = `
    SELECT
      m.media_id,
      m.url,
      m.media_type,
      m.label,
      m.alt,
      m.description,
      ${catalogSelectSql}
    FROM media_library m
    JOIN catalog_media cm ON cm.media_id = m.media_id
    JOIN catalog_items c ON ${
      catalogIdCol ? `c.id = cm.${catalogIdCol}` : `c.slug = cm.${catalogSlugCol}`
    }
    ${catalogTypeCol ? `WHERE cm.${catalogTypeCol} = 'product'` : "WHERE c.type = 'product'"}
      AND m.media_type = 'image'
      AND (m.description IS NULL OR trim(m.description) = '')
  `;

  const filters = [];
  const params = [];
  if (slugFilter) {
    filters.push('AND c.slug = ?');
    params.push(slugFilter);
  }
  
  const limitClause = Number.isFinite(limit) && limit > 0 ? `LIMIT ${limit}` : '';
  const sql = [baseSql, ...filters, limitClause].join('\n');

  console.log('\nRunning query...');
  console.log('SQL:', sql);
  if (params.length) console.log('With params:', params);
  
  try {
    const rows = await queryD1(databaseId, databaseName, sql, params);
    
    if (!rows.length) {
      console.log('No media rows found for backfill.');
      return;
    }

    console.log(`Found ${rows.length} media rows to process.`);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const mediaId = row.media_id;
      try {
        console.log(`\n[${i + 1}/${rows.length}] Processing ${mediaId} (${row.slug})...`);
        console.log('URL:', row.url);
        
      const imageDataUrl = await fetchImageAsDataUrl(row);
        const prompt = buildPrompt(row);
        console.log('Prompt length:', prompt.length);
        
        const description = await callWorkersAI(prompt, imageDataUrl);
        console.log(`Generated: ${description}`);

        if (commit) {
          const updateSql = 'UPDATE media_library SET description = ? WHERE media_id = ?';
          const updateParams = [description, mediaId];
          await queryD1(databaseId, databaseName, updateSql, updateParams);
          console.log('✅ Saved to media_library.description.');
        } else {
          console.log('🚧 Dry run (not saved). Use --commit to persist.');
        }
      } catch (error) {
        console.error(`❌ Failed for ${mediaId}:`, error.message || error);
        if (error.stack) console.error('Stack:', error.stack.split('\n')[0]);
      }
    }
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Full error:', error);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
