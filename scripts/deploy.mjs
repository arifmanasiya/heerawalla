import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const commitMessage = readCommitMessage(args);
const shouldVerify = !args.includes("--no-verify");

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const hasChanges = Boolean(runOutput("git", ["status", "--porcelain"]));
if (hasChanges) {
  if (!commitMessage) {
    console.error("Uncommitted changes detected.");
    console.error('Run: npm run deploy -- -m "Your message"');
    process.exit(1);
  }
  run("git", ["add", "-A"]);
  run("git", ["commit", "-m", commitMessage]);
}

const headSha = runOutput("git", ["rev-parse", "HEAD"]);
const branch = runOutput("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
run("git", ["push", "origin", branch]);

if (!shouldVerify) {
  console.log("Deploy pushed. Verification skipped.");
  process.exit(0);
}

const token =
  process.env.GH_TOKEN ||
  process.env.GH_HEERAWALLA_TOKEN ||
  process.env.GITHUB_TOKEN ||
  "";
const origin = runOutput("git", ["remote", "get-url", "origin"]);
const repoInfo = parseGitHubRepo(origin);
if (!token) {
  console.warn("GH_TOKEN (or GH_HEERAWALLA_TOKEN) is not set. Skipping verification.");
  process.exit(0);
}
if (!repoInfo) {
  console.warn("Could not parse GitHub repo from origin. Skipping verification.");
  process.exit(0);
}

const { owner, repo } = repoInfo;
await waitForAllWorkflows({
  owner,
  repo,
  token,
  headSha,
  branch,
});
await waitForWorkflow({
  owner,
  repo,
  token,
  headSha,
  branch,
  workflowFile: "deploy.yml",
});

const verifyTargets = resolveVerifyTargets({ owner, repo });
if (!verifyTargets.length) {
  console.log("No verification targets configured.");
  process.exit(0);
}
for (const target of verifyTargets) {
  await verifyEndpoint(target);
  console.log(`Verified ${target.label} at ${target.url}`);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runOutput(command, commandArgs) {
  return execFileSync(command, commandArgs, { encoding: "utf8" }).trim();
}

function readCommitMessage(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const entry = argv[i];
    if (entry === "-m" || entry === "--message") {
      return argv[i + 1] || "";
    }
    if (entry.startsWith("-m=")) {
      return entry.slice(3);
    }
    if (entry.startsWith("--message=")) {
      return entry.slice("--message=".length);
    }
  }
  return "";
}

function parseGitHubRepo(originUrl) {
  const match = originUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function waitForWorkflow({ owner, repo, token, headSha, branch, workflowFile }) {
  const timeoutMs = 15 * 60 * 1000;
  const pollIntervalMs = 10000;
  const deadline = Date.now() + timeoutMs;
  let runUrl = "";

  while (Date.now() < deadline) {
    const run = await findWorkflowRun({
      owner,
      repo,
      token,
      headSha,
      branch,
      workflowFile,
    });

    if (!run) {
      await sleep(pollIntervalMs);
      continue;
    }

    runUrl = run.html_url || runUrl;
    if (run.status !== "completed") {
      await sleep(pollIntervalMs);
      continue;
    }

    if (run.conclusion === "success") {
      console.log(`Workflow succeeded: ${runUrl}`);
      return;
    }

    throw new Error(`Workflow failed: ${runUrl || "unknown_url"}`);
  }

  throw new Error(`Timed out waiting for workflow. Last run: ${runUrl || "unknown"}`);
}

async function waitForAllWorkflows({ owner, repo, token, headSha, branch }) {
  const timeoutMs = 20 * 60 * 1000;
  const pollIntervalMs = 10000;
  const deadline = Date.now() + timeoutMs;
  let lastSnapshot = "";
  let stableCount = 0;
  let lastRunSummary = "";

  while (Date.now() < deadline) {
    const runs = await listWorkflowRuns({
      owner,
      repo,
      token,
      headSha,
      branch,
    });

    if (!runs.length) {
      await sleep(pollIntervalMs);
      continue;
    }

    const incomplete = runs.filter((run) => run.status !== "completed");
    if (incomplete.length) {
      lastRunSummary = summarizeRuns(runs);
      stableCount = 0;
      await sleep(pollIntervalMs);
      continue;
    }

    const failed = runs.filter((run) => !isAllowedConclusion(run.conclusion));
    if (failed.length) {
      const details = failed
        .map((run) => `${run.name || run.path || "workflow"}: ${run.conclusion} (${run.html_url})`)
        .join("\n");
      throw new Error(`Workflow failures detected:\n${details}`);
    }

    const snapshot = runs
      .map((run) => `${run.id}:${run.conclusion}`)
      .sort()
      .join("|");
    if (snapshot === lastSnapshot) {
      stableCount += 1;
    } else {
      stableCount = 0;
      lastSnapshot = snapshot;
    }

    if (stableCount >= 1) {
      console.log("All workflow runs succeeded.");
      return;
    }

    lastRunSummary = summarizeRuns(runs);
    await sleep(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for workflow runs to complete.${lastRunSummary ? `\n${lastRunSummary}` : ""}`
  );
}

async function findWorkflowRun({ owner, repo, token, headSha, branch, workflowFile }) {
  const apiUrl = new URL(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs`
  );
  apiUrl.searchParams.set("branch", branch);
  apiUrl.searchParams.set("per_page", "10");

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "heerawalla-deploy-script",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();
  const runs = Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];
  return runs.find((run) => run.head_sha === headSha) || null;
}

async function listWorkflowRuns({ owner, repo, token, headSha, branch }) {
  const apiUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/actions/runs`);
  apiUrl.searchParams.set("head_sha", headSha);
  apiUrl.searchParams.set("branch", branch);
  apiUrl.searchParams.set("event", "push");
  apiUrl.searchParams.set("per_page", "100");

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "heerawalla-deploy-script",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.workflow_runs) ? payload.workflow_runs : [];
}

function summarizeRuns(runs) {
  return runs
    .map((run) => `${run.name || run.path || "workflow"}: ${run.status}/${run.conclusion || "pending"}`)
    .join("\n");
}

function isAllowedConclusion(conclusion) {
  return conclusion === "success" || conclusion === "skipped";
}

function resolveVerifyUrl({ owner, repo }) {
  const cnamePath = path.join(process.cwd(), "public", "CNAME");
  if (fs.existsSync(cnamePath)) {
    const domain = fs.readFileSync(cnamePath, "utf8").trim();
    if (domain) {
      return `https://${domain}`;
    }
  }

  const siteEnv = (process.env.SITE || "").trim();
  if (siteEnv) {
    return siteEnv;
  }

  const baseEnv = (process.env.BASE_PATH || "").trim();
  const basePath = baseEnv || `/${repo}/`;
  const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const withSlash = normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`;
  return `https://${owner}.github.io${withSlash}`;
}

function resolveSiteVerifyUrl({ owner, repo }) {
  const explicit = (process.env.VERIFY_SITE_URL || "").trim();
  if (explicit) return explicit;
  const cnamePath = path.join(process.cwd(), "public", "CNAME");
  if (fs.existsSync(cnamePath)) {
    const domain = fs.readFileSync(cnamePath, "utf8").trim();
    if (domain) {
      return `https://${domain}`;
    }
  }
  const siteEnv = (process.env.SITE || "").trim();
  if (siteEnv) {
    return siteEnv;
  }
  if (!owner || !repo) return "";
  return "";
}

function resolveAdminVerifyUrl() {
  const explicit = (process.env.VERIFY_ADMIN_URL || "").trim();
  if (explicit) return explicit;
  const adminDomain = (process.env.ADMIN_DOMAIN || "https://business.heerawalla.com").trim();
  return adminDomain;
}

function resolveVerifyTargets({ owner, repo }) {
  const targets = [];
  const workerUrl = (process.env.VERIFY_WORKER_URL || "https://admin-api.heerawalla.com/health").trim();
  if (workerUrl) {
    targets.push({ label: "Worker health", url: workerUrl, expectHtml: false });
  }
  const adminUrl = resolveAdminVerifyUrl();
  if (adminUrl) {
    targets.push({ label: "Admin Pages", url: adminUrl, expectHtml: true });
  }
  const siteUrl = resolveSiteVerifyUrl({ owner, repo });
  if (siteUrl) {
    targets.push({ label: "Site", url: siteUrl, expectHtml: true });
  }
  return targets;
}

async function verifyEndpoint({ url, label, expectHtml }) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${label} check failed: ${response.status} ${response.statusText}`);
  }
  if (expectHtml) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.warn(`Unexpected content-type for ${url}: ${contentType}`);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log("Usage: npm run deploy -- [-m \"message\"] [--no-verify]");
}
