import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const configPath = resolveConfigPath(args);
const token = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();

if (!token || !accountId) {
  console.error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set.");
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  console.error(`wrangler.toml not found at ${configPath}`);
  process.exit(1);
}

const configText = fs.readFileSync(configPath, "utf8");
const workerName = readWorkerName(configText);
if (!workerName) {
  console.error("Unable to determine worker name from wrangler.toml.");
  process.exit(1);
}

const environment = readArg(args, "--env") || "production";
const bindings = await fetchWorkerBindings({
  accountId,
  token,
  workerName,
  environment,
});

const { vars, kvNamespaces, sendEmail } = normalizeBindings(bindings);

const nextText = updateWranglerToml(configText, { vars, kvNamespaces, sendEmail });
if (nextText === configText) {
  console.log("wrangler.toml already matches remote bindings.");
  process.exit(0);
}

fs.writeFileSync(configPath, nextText, "utf8");
console.log(`Updated ${configPath} from Cloudflare bindings.`);

function resolveConfigPath(argv) {
  const explicit = readArg(argv, "--config");
  if (explicit) {
    return path.resolve(process.cwd(), explicit);
  }
  return path.resolve(process.cwd(), "workers", "herawalla-email-atelier", "wrangler.toml");
}

function readArg(argv, key) {
  const idx = argv.indexOf(key);
  if (idx >= 0) {
    return argv[idx + 1] || "";
  }
  const prefix = `${key}=`;
  const match = argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

function readWorkerName(tomlText) {
  const match = tomlText.match(/^name\s*=\s*"([^"]+)"/m);
  return match ? match[1].trim() : "";
}

async function fetchWorkerBindings({ accountId, token, workerName, environment }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/services/${workerName}/environments/${environment}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Cloudflare API error ${response.status}: ${text}`);
  }
  const payload = JSON.parse(text);
  if (!payload.success) {
    throw new Error(`Cloudflare API failed: ${text}`);
  }
  const result = payload.result || {};
  return result.bindings || result.script?.bindings || [];
}

function normalizeBindings(bindings) {
  const vars = {};
  const kvNamespaces = [];
  const sendEmail = [];

  bindings.forEach((binding) => {
    const type = String(binding.type || "");
    if (type === "plain_text") {
      vars[binding.name] = String(binding.text ?? binding.value ?? "");
      return;
    }
    if (type === "json") {
      vars[binding.name] = JSON.stringify(binding.json ?? binding.value ?? {});
      return;
    }
    if (type === "kv_namespace") {
      kvNamespaces.push({
        binding: binding.name,
        id: binding.namespace_id || binding.id || "",
        preview_id: binding.preview_id || "",
      });
      return;
    }
    if (type === "send_email") {
      sendEmail.push({
        name: binding.name,
        allowed_sender_addresses: binding.allowed_sender_addresses || [],
        allowed_recipient_addresses: binding.allowed_recipient_addresses || [],
      });
    }
  });

  return { vars, kvNamespaces, sendEmail };
}

function updateWranglerToml(tomlText, { vars, kvNamespaces, sendEmail }) {
  let lines = tomlText.split(/\r?\n/);
  lines = replaceVarsBlock(lines, vars);
  lines = replaceArrayBlock(lines, "[[send_email]]", renderSendEmail(sendEmail));
  lines = replaceArrayBlock(lines, "[[kv_namespaces]]", renderKvNamespaces(kvNamespaces));
  return lines.join("\n");
}

function replaceVarsBlock(lines, vars) {
  const rendered = renderVars(vars);
  if (!rendered.length) return lines;
  const blockStart = lines.findIndex((line) => line.trim() === "[vars]");
  if (blockStart < 0) {
    return [...lines, "", ...rendered, ""];
  }
  let blockEnd = blockStart + 1;
  while (blockEnd < lines.length) {
    const trimmed = lines[blockEnd].trim();
    if (trimmed.startsWith("[") && trimmed !== "[vars]") break;
    blockEnd += 1;
  }
  return [...lines.slice(0, blockStart), ...rendered, ...lines.slice(blockEnd)];
}

function replaceArrayBlock(lines, header, rendered) {
  if (!rendered.length) return lines;
  const next = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === header) {
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("[")) {
        i += 1;
      }
      continue;
    }
    next.push(lines[i]);
    i += 1;
  }
  return [...next, "", ...rendered, ""];
}

function renderVars(vars) {
  const entries = Object.entries(vars || {}).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return [];
  const lines = ["[vars]"];
  entries.forEach(([key, value]) => {
    lines.push(`${key} = "${escapeTomlString(String(value))}"`);
  });
  return lines;
}

function renderKvNamespaces(items) {
  if (!items.length) return [];
  const lines = [];
  items.forEach((item) => {
    if (!item.binding || !item.id) return;
    lines.push("[[kv_namespaces]]");
    lines.push(`binding = "${escapeTomlString(item.binding)}"`);
    lines.push(`id = "${escapeTomlString(item.id)}"`);
    if (item.preview_id) {
      lines.push(`preview_id = "${escapeTomlString(item.preview_id)}"`);
    }
    lines.push("");
  });
  return trimTrailingBlank(lines);
}

function renderSendEmail(items) {
  if (!items.length) return [];
  const lines = [];
  items.forEach((item) => {
    if (!item.name) return;
    lines.push("[[send_email]]");
    lines.push(`name = "${escapeTomlString(item.name)}"`);
    if (item.allowed_sender_addresses?.length) {
      lines.push(
        `allowed_sender_addresses = [${item.allowed_sender_addresses
          .map((entry) => `"${escapeTomlString(String(entry))}"`)
          .join(", ")}]`
      );
    }
    if (item.allowed_recipient_addresses?.length) {
      lines.push(
        `allowed_recipient_addresses = [${item.allowed_recipient_addresses
          .map((entry) => `"${escapeTomlString(String(entry))}"`)
          .join(", ")}]`
      );
    }
    lines.push("");
  });
  return trimTrailingBlank(lines);
}

function trimTrailingBlank(lines) {
  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop();
  }
  return lines;
}

function escapeTomlString(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}
