import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const WRANGLER_TOML = path.join(
  repoRoot,
  "workers",
  "herawalla-email-atelier",
  "wrangler.toml"
);
const DEV_VARS = path.join(
  repoRoot,
  "workers",
  "herawalla-email-atelier",
  ".dev.vars"
);
const DEFAULT_OUT_DIR = path.join(repoRoot, "scripts", "d1", "seed");

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--execute");
const truncate = !args.has("--no-truncate");
const outDir = getArgValue("--out") || DEFAULT_OUT_DIR;
const d1Name = getArgValue("--db") || process.env.D1_DATABASE_NAME || "";
const d1Binding = getArgValue("--binding") || process.env.D1_DATABASE_BINDING || "";
const d1Mode = args.has("--local") ? "--local" : args.has("--remote") ? "--remote" : "";

const listFields = new Set([
  "categories",
  "styles",
  "motifs",
  "metals",
  "stone_types",
  "takeaways",
  "translation_notes",
  "tags",
]);

async function main() {
  const vars = await loadWranglerVars(WRANGLER_TOML);
  const secrets = await loadEnvVars(DEV_VARS);

  const sources = buildSheetSources(vars);
  await fs.mkdir(outDir, { recursive: true });

  const catalogRows = [];
  const mediaRows = [];
  const mediaLibraryRows = [];
  const siteConfigRows = [];
  const priceChartRows = [];
  const costChartRows = [];
  const diamondPriceRows = [];
  const ordersRows = [];
  const orderDetailsRows = [];
  const quotesRows = [];
  const ticketsRows = [];
  const ticketDetailsRows = [];
  const contactsRows = [];

  for (const source of sources) {
    if (!source.url) continue;
    let csv = "";
    try {
      csv = await fetchCsv(source.url);
    } catch (error) {
      const message = String(error);
      if (message.includes("(401)") || message.includes("(403)")) {
        const rows = await fetchSheetValues(source, secrets);
        if (!rows.length) {
          console.warn(`Skipping ${source.kind}: ${message}`);
          continue;
        }
        const records = rowsToRecords(rows);
        if (!records.length) continue;
        assignRecords(source, records, {
          catalogRows,
          mediaLibraryRows,
          mediaRows,
          siteConfigRows,
          priceChartRows,
          costChartRows,
          diamondPriceRows,
          ordersRows,
          orderDetailsRows,
          quotesRows,
          ticketsRows,
          ticketDetailsRows,
        });
        continue;
      }
      console.warn(`Skipping ${source.kind}: ${message}`);
      continue;
    }
    const records = parseCsv(csv);
    if (!records.length) continue;
    assignRecords(source, records, {
      catalogRows,
      mediaLibraryRows,
      mediaRows,
      siteConfigRows,
      priceChartRows,
      costChartRows,
      diamondPriceRows,
      ordersRows,
      orderDetailsRows,
      quotesRows,
      ticketsRows,
      ticketDetailsRows,
    });
  }

  contactsRows.push(
    ...buildContactsDirectoryRows({ ordersRows, quotesRows, ticketsRows })
  );
  injectInspirationHeroMedia(catalogRows, mediaLibraryRows, mediaRows);

  await writeSeedFile(
    path.join(outDir, "01_catalog.sql"),
    buildCatalogSql(catalogRows, mediaLibraryRows, mediaRows)
  );
  await writeSeedFile(
    path.join(outDir, "01b_catalog_notes.sql"),
    buildCatalogNotesSql(buildCatalogNotesRows(catalogRows))
  );
  await writeSeedFile(
    path.join(outDir, "01c_catalog_stone_options.sql"),
    buildCatalogStoneOptionsSql(buildCatalogStoneOptionsRows(catalogRows))
  );
  await writeSeedFile(
    path.join(outDir, "01d_catalog_metal_options.sql"),
    buildCatalogMetalOptionsSql(buildCatalogMetalOptionsRows(catalogRows))
  );
  await writeSeedFile(
    path.join(outDir, "02_site_config.sql"),
    buildSimpleSql("site_config", siteConfigRows, ["key", "value", "updated_at"])
  );
  await writeSeedFile(
    path.join(outDir, "03_pricing.sql"),
    buildPricingSql(priceChartRows, costChartRows, diamondPriceRows)
  );
  await writeSeedFile(
    path.join(outDir, "04_orders.sql"),
    buildAdminSql("orders", ordersRows, ["request_id"])
  );
  await writeSeedFile(
    path.join(outDir, "05_order_details.sql"),
    buildAdminSql("order_details", orderDetailsRows, ["request_id"])
  );
  await writeSeedFile(
    path.join(outDir, "06_quotes.sql"),
    buildAdminSql("quotes", quotesRows, ["request_id"])
  );
  await writeSeedFile(
    path.join(outDir, "07_tickets.sql"),
    buildAdminSql("tickets", ticketsRows, ["request_id"])
  );
  await writeSeedFile(
    path.join(outDir, "08_ticket_details.sql"),
    buildAdminSql("ticket_details", ticketDetailsRows, ["request_id"])
  );
  await writeSeedFile(
    path.join(outDir, "09_contacts.sql"),
    buildAdminSql("contacts", contactsRows, ["email"])
  );

  if (shouldExecute) {
    if (!d1Name && !d1Binding) {
      throw new Error("Missing D1 database name or binding. Use --db or --binding.");
    }
    await executeSeedFiles(outDir, d1Name || d1Binding, d1Mode);
  }
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

async function loadWranglerVars(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const vars = {};
  let inVars = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[")) {
      inVars = line === "[vars]";
      continue;
    }
    if (!inVars) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*"(.*)"\s*$/);
    if (!match) continue;
    vars[match[1]] = match[2];
  }
  return vars;
}

  function buildSheetSources(vars) {
    const sheetId = vars.CATALOG_SHEET_ID || "";
    const contactsSheetId = vars.CUSTOMER_TICKETS_SHEET_ID || vars.CONTACTS_SHEET_ID || "";
    const contactsSheetName = vars.CUSTOMER_TICKETS_SHEET_NAME || vars.CONTACTS_SHEET_NAME || "";
    const sources = [
    {
      kind: "catalog",
      catalogType: "product",
      url: buildGidUrl(sheetId, vars.CATALOG_PRODUCTS_GID, vars.CATALOG_PRODUCTS_SHEET_NAME),
      sheetId,
      sheetName: vars.CATALOG_PRODUCTS_SHEET_NAME || "",
    },
    {
      kind: "catalog",
      catalogType: "inspiration",
      url: buildGidUrl(sheetId, vars.CATALOG_INSPIRATIONS_GID, vars.CATALOG_INSPIRATIONS_SHEET_NAME),
      sheetId,
      sheetName: vars.CATALOG_INSPIRATIONS_SHEET_NAME || "",
    },
    {
      kind: "site_config",
      url: buildGidUrl(sheetId, vars.CATALOG_SITE_CONFIG_GID, vars.CATALOG_SITE_CONFIG_SHEET_NAME),
      sheetId,
      sheetName: vars.CATALOG_SITE_CONFIG_SHEET_NAME || "",
    },
    {
      kind: "media_library",
      url: buildGidUrl(sheetId, vars.CATALOG_MEDIA_LIBRARY_GID, vars.MEDIA_LIBRARY_SHEET_NAME),
      sheetId,
      sheetName: vars.MEDIA_LIBRARY_SHEET_NAME || "",
    },
    {
      kind: "catalog_media",
      catalogType: "product",
      url: buildGidUrl(sheetId, vars.CATALOG_PRODUCT_MEDIA_GID, vars.PRODUCT_MEDIA_SHEET_NAME),
      sheetId,
      sheetName: vars.PRODUCT_MEDIA_SHEET_NAME || "",
    },
    {
      kind: "catalog_media",
      catalogType: "inspiration",
      url: buildGidUrl(sheetId, vars.CATALOG_INSPIRATION_MEDIA_GID, vars.INSPIRATION_MEDIA_SHEET_NAME),
      sheetId,
      sheetName: vars.INSPIRATION_MEDIA_SHEET_NAME || "",
    },
    {
      kind: "price_chart",
      url: buildSheetUrl(vars.PRICE_CHART_SHEET_ID, vars.PRICE_CHART_SHEET_NAME),
      sheetId: vars.PRICE_CHART_SHEET_ID || "",
      sheetName: vars.PRICE_CHART_SHEET_NAME || "",
    },
    {
      kind: "cost_chart",
      url: buildSheetUrl(vars.COST_CHART_SHEET_ID, vars.COST_CHART_SHEET_NAME),
      sheetId: vars.COST_CHART_SHEET_ID || "",
      sheetName: vars.COST_CHART_SHEET_NAME || "",
    },
    {
      kind: "diamond_price_chart",
      url: buildSheetUrl(
        vars.DIAMOND_PRICE_CHART_SHEET_ID,
        vars.DIAMOND_PRICE_CHART_SHEET_NAME
      ),
      sheetId: vars.DIAMOND_PRICE_CHART_SHEET_ID || "",
      sheetName: vars.DIAMOND_PRICE_CHART_SHEET_NAME || "",
    },
    {
      kind: "orders",
      url: buildSheetUrl(vars.ORDER_SHEET_ID, vars.ORDER_SHEET_NAME),
      sheetId: vars.ORDER_SHEET_ID || "",
      sheetName: vars.ORDER_SHEET_NAME || "",
    },
    {
      kind: "order_details",
      url: buildSheetUrl(vars.ORDER_DETAILS_SHEET_ID, vars.ORDER_DETAILS_SHEET_NAME),
      sheetId: vars.ORDER_DETAILS_SHEET_ID || "",
      sheetName: vars.ORDER_DETAILS_SHEET_NAME || "",
    },
    {
      kind: "quotes",
      url: buildSheetUrl(vars.QUOTE_SHEET_ID, vars.QUOTE_SHEET_NAME),
      sheetId: vars.QUOTE_SHEET_ID || "",
      sheetName: vars.QUOTE_SHEET_NAME || "",
    },
      {
        kind: "contacts",
        url: buildSheetUrl(contactsSheetId, contactsSheetName),
        sheetId: contactsSheetId,
        sheetName: contactsSheetName,
      },
  ];
  return sources.filter((source) => source.url);
}

function buildGidUrl(sheetId, gid, sheetName) {
  if (!sheetId) return "";
  if (gid) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  if (!sheetName) return "";
  return buildSheetUrl(sheetId, sheetName);
}

function buildSheetUrl(sheetId, sheetName) {
  if (!sheetId || !sheetName) return "";
  const encoded = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${url} (${response.status})`);
  }
  return response.text();
}

async function loadEnvVars(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const vars = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      vars[match[1]] = match[2];
    }
    return vars;
  } catch {
    return {};
  }
}

async function fetchSheetValues(source, secrets) {
  const sheetId = source.sheetId || "";
  const sheetName = source.sheetName || "";
  if (!sheetId || !sheetName) return [];
  const accessToken = await getGoogleAccessToken(secrets);
  if (!accessToken) return [];
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.warn(`Failed Sheets API fetch for ${source.kind}: ${response.status}`);
    return [];
  }
  const payload = await response.json();
  return Array.isArray(payload.values) ? payload.values : [];
}

async function getGoogleAccessToken(secrets) {
  const clientId = secrets.GOOGLE_CLIENT_ID;
  const clientSecret = secrets.GOOGLE_CLIENT_SECRET;
  const refreshToken = secrets.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return "";
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return "";
  const payload = await response.json();
  return payload.access_token || "";
}

function rowsToRecords(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((header) => String(header || "").trim());
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = String(row[index] ?? "").trim();
    });
    return record;
  }).filter((record) => Object.values(record).some((value) => value));
}

function assignRecords(source, records, buckets) {
  if (!records.length) return;
  if (source.kind === "catalog") {
    buckets.catalogRows.push(
      ...records.map((record) => normalizeCatalogItem(record, source.catalogType))
    );
  } else if (source.kind === "media_library") {
    buckets.mediaLibraryRows.push(...records);
  } else if (source.kind === "catalog_media") {
    buckets.mediaRows.push(...normalizeCatalogMedia(records, source.catalogType));
  } else if (source.kind === "site_config") {
    buckets.siteConfigRows.push(...records);
  } else if (source.kind === "price_chart") {
    buckets.priceChartRows.push(...records);
  } else if (source.kind === "cost_chart") {
    buckets.costChartRows.push(...records);
  } else if (source.kind === "diamond_price_chart") {
    buckets.diamondPriceRows.push(...records);
  } else if (source.kind === "orders") {
    buckets.ordersRows.push(...records);
  } else if (source.kind === "order_details") {
    buckets.orderDetailsRows.push(...records.map(normalizeOrderDetailsRow));
  } else if (source.kind === "quotes") {
    buckets.quotesRows.push(...records);
  } else if (source.kind === "contacts") {
    const normalized = records.map(normalizeTicketRow);
    buckets.ticketsRows.push(...normalized);
    buckets.ticketDetailsRows.push(...buildTicketDetailsRows(normalized));
  }
}

function normalizeOrderDetailsRow(record) {
  const normalized = { ...record };
  const shippingMethod = String(normalized.shipping_method || "").trim();
  const paymentUrl = String(normalized.payment_url || "").trim();
  if (!paymentUrl && /^https?:\/\//i.test(shippingMethod)) {
    normalized.payment_url = shippingMethod;
    normalized.shipping_method = "";
  }
  const updatedBy = String(normalized.updated_by || "").trim();
  const lastShippingCheck = String(normalized.last_shipping_check_at || "").trim();
  const updatedAt = String(normalized.updated_at || "").trim();
  const isTimestamp = (value) => /^\d{4}-\d{2}-\d{2}T/.test(value);
  if (isTimestamp(updatedBy) && (!updatedAt || !isTimestamp(updatedAt))) {
    normalized.updated_at = updatedBy;
    normalized.updated_by = lastShippingCheck && !isTimestamp(lastShippingCheck) ? lastShippingCheck : "";
    normalized.last_shipping_check_at = "";
  }
  return normalized;
}

function normalizeTicketRow(record) {
  const createdAt = record.created_at || record.createdAt || new Date().toISOString();
  return {
    created_at: createdAt,
    request_id: record.request_id || record.requestId || "",
    status: record.status || "NEW",
    subject: record.interests || record.contact_preference || "",
    summary: record.notes || "",
    name: record.name || "",
    email: record.email || "",
    phone: record.phone || "",
    source: record.source || "contact",
    page_url: record.page_url || record.pageUrl || "",
    updated_at: record.updated_at || createdAt,
    updated_by: record.updated_by || "import",
  };
}

function buildTicketDetailsRows(ticketsRows) {
  return ticketsRows
    .filter((row) => String(row.summary || "").trim())
    .map((row) => ({
      request_id: row.request_id,
      created_at: row.created_at || new Date().toISOString(),
      kind: "note",
      note: row.summary,
      updated_by: row.updated_by || "import",
    }));
}

function buildContactsDirectoryRows({ ordersRows, quotesRows, ticketsRows }) {
  const directory = new Map();
  const merge = (row, source) => {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email) return;
    const entry = directory.get(email) || {
      created_at: row.created_at || "",
      email,
      name: row.name || "",
      phone: row.phone || "",
      sources: new Set(),
      updated_at: row.created_at || new Date().toISOString(),
      updated_by: "import",
    };
    if (!entry.name && row.name) entry.name = row.name;
    if (!entry.phone && row.phone) entry.phone = row.phone;
    if (row.created_at && (!entry.created_at || new Date(row.created_at) < new Date(entry.created_at))) {
      entry.created_at = row.created_at;
    }
    entry.sources.add(source);
    directory.set(email, entry);
  };
  ordersRows.forEach((row) => merge(row, "order"));
  quotesRows.forEach((row) => merge(row, "quote"));
  ticketsRows.forEach((row) => merge(row, "ticket"));
  return Array.from(directory.values()).map((entry) => ({
    created_at: entry.created_at || entry.updated_at,
    email: entry.email,
    name: entry.name,
    phone: entry.phone,
    source: Array.from(entry.sources).join(","),
    updated_at: entry.updated_at,
    updated_by: entry.updated_by,
  }));
}

function parseCsv(csv) {
  const rows = parse(csv, {
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  });
  if (!rows.length) return [];
  const headers = rows[0].map((header) => String(header || "").trim());
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = String(row[index] ?? "").trim();
    });
    return record;
  }).filter((record) => Object.values(record).some((value) => value));
}

function normalizeCatalogItem(record, type) {
  const normalized = { ...record };
  normalized.type = type;
  normalized.id = normalized.id || normalized.slug || "";
  if (normalized.short_desc && !normalized.description) {
    normalized.description = normalized.short_desc;
  } else if (normalized.short_desc && normalized.description) {
    const desc = String(normalized.description).trim();
    const shortDesc = String(normalized.short_desc).trim();
    if (desc && shortDesc && desc !== shortDesc) {
      normalized.description = `${desc}\n\n${shortDesc}`;
    }
  }
  delete normalized.short_desc;
  normalized.is_active = normalizeBoolean(record.is_active);
  normalized.is_featured = normalizeBoolean(record.is_featured);
  for (const field of listFields) {
    if (field in normalized) {
      normalized[field] = toJsonArray(normalized[field]);
    }
  }
  normalized.created_at = "datetime('now')";
  normalized.updated_at = "datetime('now')";
  return normalized;
}

function normalizeCatalogMedia(records, catalogType) {
  return records.map((record) => ({
    catalog_type: catalogType,
    catalog_slug:
      record.product_slug || record.inspiration_slug || record.slug || "",
    media_id: record.media_id || "",
    position: record.position || "",
    is_primary: normalizeBoolean(record.is_primary),
    sort_order: toNumber(record.order),
  }));
}

function buildCatalogSql(catalogRows, mediaLibraryRows, mediaRows) {
  const lines = [];
  if (truncate) {
    lines.push("DELETE FROM catalog_media;");
    lines.push("DELETE FROM media_library;");
    lines.push("DELETE FROM catalog_items;");
  }

  const catalogByKey = new Map(
    catalogRows.map((row) => [
      `${String(row.type || "").toLowerCase()}:${String(row.slug || "").toLowerCase()}`,
      row.id,
    ])
  );
  const resolvedMediaRows = mediaRows
    .map((row) => {
      const typeKey = String(row.catalog_type || "").toLowerCase();
      const slugKey = String(row.catalog_slug || "").toLowerCase();
      if (!typeKey || !slugKey) return null;
      const catalogId = catalogByKey.get(`${typeKey}:${slugKey}`);
      if (!catalogId) return null;
      return {
        catalog_id: catalogId,
        media_id: row.media_id || "",
        position: row.position || "",
        is_primary: row.is_primary || 0,
        sort_order: row.sort_order ?? null,
      };
    })
    .filter(Boolean);

  lines.push(
    ...buildInsertLines("catalog_items", catalogRows, [
      "id",
      "type",
      "name",
      "slug",
      "categories",
      "gender",
      "styles",
      "motifs",
      "metals",
      "stone_types",
      "design_code",
      "cut",
      "clarity",
      "color",
      "is_active",
      "is_featured",
      "tags",
      "created_at",
      "updated_at",
    ])
  );

  lines.push(
    ...buildInsertLines("media_library", mediaLibraryRows, [
      "media_id",
      "url",
      "media_type",
      "label",
      "alt",
      "description",
      "created_at",
    ])
  );

  lines.push(
    ...buildInsertLines("catalog_media", resolvedMediaRows, [
      "catalog_id",
      "media_id",
      "position",
      "is_primary",
      "sort_order",
    ])
  );

  return lines.join("\n");
}

function injectInspirationHeroMedia(catalogRows, mediaLibraryRows, mediaRows) {
  const urlToMediaId = new Map();
  mediaLibraryRows.forEach((row) => {
    const url = String(row.url || "").trim();
    const mediaId = String(row.media_id || "").trim();
    if (url && mediaId) urlToMediaId.set(url, mediaId);
  });
  const existingMappings = new Set(
    mediaRows.map((row) => `${row.catalog_type}:${row.catalog_slug}:${row.media_id}`)
  );
  catalogRows.forEach((row) => {
    if (String(row.type || "") !== "inspiration") return;
    const heroUrl = String(row.hero_image || "").trim();
    if (!heroUrl) return;
    let mediaId = urlToMediaId.get(heroUrl);
    if (!mediaId) {
      const slug = String(row.slug || "").trim();
      if (!slug) return;
      mediaId = `hero_${slug}`;
      urlToMediaId.set(heroUrl, mediaId);
      mediaLibraryRows.push({
        media_id: mediaId,
        url: heroUrl,
        media_type: "image",
        label: "Hero",
        alt: "",
        description: "",
        created_at: "datetime('now')",
      });
    }
    const slug = String(row.slug || "").trim();
    if (!slug) return;
    const key = `inspiration:${slug}:${mediaId}`;
    if (existingMappings.has(key)) return;
    mediaRows.push({
      catalog_type: "inspiration",
      catalog_slug: slug,
      media_id: mediaId,
      position: "hero",
      is_primary: 1,
      sort_order: 0,
    });
    existingMappings.add(key);
  });
}

function buildCatalogNotesRows(catalogRows) {
  const rows = [];
  catalogRows.forEach((row) => {
    const catalogId = String(row.id || "").trim();
    const catalogSlug = String(row.slug || "").trim();
    if (!catalogId || !catalogSlug) return;
    const description = String(row.description || "").trim();
    if (description) {
      rows.push({
        id: `note_${catalogId}_description`,
        catalog_id: catalogId,
        catalog_slug: catalogSlug,
        kind: "description",
        note: description,
        sort_order: 0,
      });
    }
    const longDesc = String(row.long_desc || "").trim();
    if (longDesc) {
      rows.push({
        id: `note_${catalogId}_long_desc`,
        catalog_id: catalogId,
        catalog_slug: catalogSlug,
        kind: "long_desc",
        note: longDesc,
        sort_order: 0,
      });
    }
    const takeaways = parseNoteList(row.takeaways);
    const translations = parseNoteList(row.translation_notes);
    takeaways.forEach((note, index) => {
      if (!note) return;
      rows.push({
        id: `note_${catalogId}_${index}_takeaway`,
        catalog_id: catalogId,
        catalog_slug: catalogSlug,
        kind: "takeaway",
        note,
        sort_order: index,
      });
    });
    translations.forEach((note, index) => {
      if (!note) return;
      rows.push({
        id: `note_${catalogId}_${index}_translation`,
        catalog_id: catalogId,
        catalog_slug: catalogSlug,
        kind: "translation_note",
        note,
        sort_order: index,
      });
    });
  });
  return rows;
}

function buildCatalogNotesSql(noteRows) {
  const lines = [];
  if (truncate) {
    lines.push("DELETE FROM catalog_notes;");
  }
  if (!noteRows.length) return lines.join("\n");
  lines.push(
    ...buildInsertLines("catalog_notes", noteRows, [
      "id",
      "catalog_id",
      "catalog_slug",
      "kind",
      "note",
      "sort_order",
    ])
  );
  return lines.join("\n");
}

const STONE_WEIGHT_NOTES = [
  "small",
  "medium",
  "large",
  "xlarge",
  "xxlarge",
  "xxxlarge",
  "xxxxlarge",
];

function parseStoneWeightEntry(entry) {
  const trimmed = String(entry || "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(/([0-9]*\\.?[0-9]+)\\s*[xX]\\s*([0-9]*\\.?[0-9]+)/);
  if (match) {
    return { carat: Number(match[1]), count: Number(match[2]) };
  }
  const numbers = trimmed.match(/[0-9]*\\.?[0-9]+/g) || [];
  if (numbers.length >= 2) {
    const first = Number(numbers[0]);
    const second = Number(numbers[1]);
    const carat = first <= second ? first : second;
    const count = first <= second ? second : first;
    return { carat, count };
  }
  return null;
}

function buildCatalogStoneOptionsRows(catalogRows) {
  const rows = [];
  catalogRows.forEach((row) => {
    const catalogId = String(row.id || "").trim();
    if (!catalogId) return;
    const raw = String(row.stone_weight || "").trim();
    if (!raw) return;
    const groups = raw
      .split("|")
      .map((group) => group.trim())
      .filter(Boolean);
    groups.forEach((group, groupIndex) => {
      const note =
        STONE_WEIGHT_NOTES[groupIndex] ||
        STONE_WEIGHT_NOTES[STONE_WEIGHT_NOTES.length - 1];
      const items = group
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      items.forEach((item, itemIndex) => {
        const parsed = parseStoneWeightEntry(item);
        if (!parsed || !Number.isFinite(parsed.carat) || !Number.isFinite(parsed.count)) return;
        rows.push({
          id: `stoneopt_${catalogId}_${groupIndex}_${itemIndex}`,
          catalog_id: catalogId,
          role: "Accent",
          carat: parsed.carat,
          count: parsed.count,
          is_primary: groupIndex === 0 ? 1 : 0,
            size_type: note,
          created_at: row.created_at || "datetime('now')",
          updated_at: row.updated_at || "datetime('now')",
        });
      });
    });
  });
  return rows;
}

function buildCatalogStoneOptionsSql(optionRows) {
  const lines = [];
  if (truncate) {
    lines.push("DELETE FROM catalog_stone_options;");
  }
  if (!optionRows.length) return lines.join("\n");
  lines.push(
    ...buildInsertLines("catalog_stone_options", optionRows, [
      "id",
      "catalog_id",
      "role",
      "carat",
      "count",
      "is_primary",
        "size_type",
      "created_at",
      "updated_at",
    ])
  );
  return lines.join("\n");
}

function buildCatalogMetalOptionsRows(catalogRows) {
  const rows = [];
  catalogRows.forEach((row) => {
    const catalogId = String(row.id || "").trim();
    if (!catalogId) return;
    const metalWeight = String(row.metal_weight || "").trim();
    if (!metalWeight) return;
    const parts = metalWeight
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    parts.forEach((entry, index) => {
      const note =
        STONE_WEIGHT_NOTES[index] ||
        STONE_WEIGHT_NOTES[STONE_WEIGHT_NOTES.length - 1];
      rows.push({
        id: `metalopt_${catalogId}_${index}`,
        catalog_id: catalogId,
        metal_weight: entry,
        is_primary: index === 0 ? 1 : 0,
        size_type: note,
        created_at: row.created_at || "datetime('now')",
        updated_at: row.updated_at || "datetime('now')",
      });
    });
  });
  return rows;
}

function buildCatalogMetalOptionsSql(optionRows) {
  const lines = [];
  if (truncate) {
    lines.push("DELETE FROM catalog_metal_options;");
  }
  if (!optionRows.length) return lines.join("\n");
  lines.push(
    ...buildInsertLines("catalog_metal_options", optionRows, [
      "id",
      "catalog_id",
      "metal_weight",
      "is_primary",
      "size_type",
      "created_at",
      "updated_at",
    ])
  );
  return lines.join("\n");
}

function buildSimpleSql(table, rows, columns) {
  const lines = [];
  if (truncate) {
    lines.push(`DELETE FROM ${table};`);
  }
  const withDefaults = rows.map((row) => ({
    ...row,
    updated_at: "datetime('now')",
  }));
  lines.push(...buildInsertLines(table, withDefaults, columns));
  return lines.join("\n");
}

function parseNoteList(value) {
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
    } catch {
      return [text];
    }
  }
  if (text.includes("|")) {
    return text.split("|").map((entry) => entry.trim()).filter(Boolean);
  }
  if (text.includes(",")) {
    return text.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return [text];
}

function buildPricingSql(priceChartRows, costChartRows, diamondRows) {
  const lines = [];
  if (truncate) {
    lines.push("DELETE FROM price_chart;");
    lines.push("DELETE FROM cost_chart;");
    lines.push("DELETE FROM diamond_price_chart;");
  }
  lines.push(
    ...buildInsertLines(
      "price_chart",
      priceChartRows.map((row) => ({
        ...row,
        adjustment_value: toNumber(row.adjustment_value),
      })),
      ["metal", "adjustment_type", "adjustment_value", "notes"]
    )
  );
  lines.push(
    ...buildInsertLines(
      "cost_chart",
      costChartRows.map((row) => ({
        ...row,
        value: toNumber(row.value),
      })),
      ["key", "value", "unit", "notes"]
    )
  );
  lines.push(
    ...buildInsertLines(
      "diamond_price_chart",
      diamondRows.map((row) => ({
        ...row,
        weight_min: toNumber(row.weight_min),
        weight_max: toNumber(row.weight_max),
        price_per_ct: toNumber(row.price_per_ct),
      })),
      ["clarity", "color", "weight_min", "weight_max", "price_per_ct", "notes"]
    )
  );
  return lines.join("\n");
}

function buildAdminSql(table, rows, requiredKeys) {
  const lines = [];
  if (truncate) {
    lines.push(`DELETE FROM ${table};`);
  }
  const filtered = rows.filter((row) =>
    requiredKeys.every((key) => String(row[key] || "").trim())
  );
  lines.push(...buildInsertLines(table, filtered, Object.keys(filtered[0] || {})));
  return lines.join("\n");
}

function buildInsertLines(table, rows, columns) {
  if (!rows.length) return [];
  const lines = [];
  for (const row of rows) {
    const values = columns.map((column) => sqlValue(row[column]));
    const columnsSql = columns.join(", ");
    lines.push(
      `INSERT OR REPLACE INTO ${table} (${columnsSql}) VALUES (${values.join(", ")});`
    );
  }
  return lines;
}

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value === "datetime('now')") return value;
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

function normalizeBoolean(value) {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return 0;
  return text === "TRUE" || text === "1" || text === "YES" ? 1 : 0;
}

function toNumber(value) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toJsonArray(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parts = text.includes("|")
    ? text.split("|")
    : text.includes(",")
    ? text.split(",")
    : [text];
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  return JSON.stringify(cleaned);
}

async function writeSeedFile(filePath, contents) {
  await fs.writeFile(filePath, contents, "utf8");
}

async function executeSeedFiles(seedDir, database, modeFlag) {
  const files = (await fs.readdir(seedDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const fullPath = path.join(seedDir, file);
    const args = ["d1", "execute", database, "--config", WRANGLER_TOML];
    if (modeFlag) {
      args.push(modeFlag);
    }
    args.push("--file", fullPath);
    const result = spawnSync("npx", ["wrangler", ...args], {
      stdio: "inherit",
      cwd: repoRoot,
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`wrangler failed for ${file}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
