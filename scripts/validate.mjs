// Validates the plugin manifests against the limits in OpenAI's plugin
// submission docs and the Claude Code plugin format. No dependencies.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const errors = [];
const fail = (m) => errors.push(m);
const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(join(root, p), "utf8"));
  } catch (e) {
    fail(`${p}: ${e.message}`);
    return null;
  }
};
const str = (o, k, max, where) => {
  const v = o?.[k];
  if (typeof v !== "string" || !v.trim()) return fail(`${where}.${k} is required`);
  if (v.length > max) fail(`${where}.${k} is ${v.length} chars, max ${max}`);
};
const https = (o, k, where) => {
  const v = o?.[k];
  if (typeof v !== "string") return fail(`${where}.${k} is required`);
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) fail(`${where}.${k} must be plain HTTPS`);
  } catch {
    fail(`${where}.${k} is not a URL`);
  }
};
const file = (base, rel, where) => {
  if (typeof rel !== "string" || !rel.startsWith("./")) return fail(`${where} must start with ./`);
  const p = join(root, base, rel);
  if (!p.startsWith(join(root, base))) return fail(`${where} escapes the plugin`);
  if (!existsSync(p)) return fail(`${where}: ${rel} does not exist`);
  if (statSync(p).size > 5 * 1024 * 1024) fail(`${where}: ${rel} is over 5 MiB`);
};
const pngSize = (p) => {
  const b = readFileSync(p);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

const dir = "plugins/nextleg";
const codex = readJson(`${dir}/.codex-plugin/plugin.json`);
const claude = readJson(`${dir}/.claude-plugin/plugin.json`);
const mcp = readJson(`${dir}/.mcp.json`);
const agents = readJson(".agents/plugins/marketplace.json");
const cmarket = readJson(".claude-plugin/marketplace.json");

if (codex) {
  const w = "codex plugin.json";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(codex.name ?? "") || codex.name.length > 64) fail(`${w}.name invalid`);
  if (!/^\d+\.\d+\.\d+$/.test(codex.version ?? "")) fail(`${w}.version must be semver`);
  str(codex, "description", 4000, w);
  str(codex.author, "name", 120, `${w}.author`);
  https(codex, "homepage", w);
  if (codex.apps || codex.hooks) fail(`${w}: apps and hooks cannot be submitted`);
  const i = codex.interface;
  const wi = `${w}.interface`;
  str(i, "displayName", 30, wi);
  str(i, "shortDescription", 30, wi);
  str(i, "longDescription", 4000, wi);
  str(i, "developerName", 80, wi);
  str(i, "category", 80, wi);
  for (const k of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) https(i, k, wi);
  if (!Array.isArray(i?.capabilities) || i.capabilities.length > 20) fail(`${wi}.capabilities must be an array of up to 20`);
  const dp = i?.defaultPrompt ?? [];
  if (dp.length > 3 || new Set(dp).size !== dp.length || dp.some((p) => p.length > 128)) fail(`${wi}.defaultPrompt: up to 3 unique prompts, 128 chars each`);
  for (const k of ["brandColor", "brandColorDark"]) if (i?.[k] && !/^#[0-9A-Fa-f]{6}$/.test(i[k])) fail(`${wi}.${k} must be #RRGGBB`);
  for (const k of ["logo", "composerIcon", "logoDark", "composerIconDark"]) {
    if (!i?.[k]) {
      if (k === "logo" || k === "composerIcon") fail(`${wi}.${k} is required`);
      continue;
    }
    file(dir, i[k], `${wi}.${k}`);
    const p = join(root, dir, i[k]);
    if (existsSync(p) && i[k].endsWith(".png")) {
      const [x, y] = pngSize(p);
      if (x !== y || x < 48 || x > 4096) fail(`${wi}.${k} must be square, 48 to 4096 px (is ${x}x${y})`);
    }
    if (existsSync(p) && i[k].endsWith(".svg")) {
      const m = readFileSync(p, "utf8").match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
      if (!m || m[1] !== m[2] || +m[1] < 48) fail(`${wi}.${k} needs a square viewBox of at least 48`);
    }
  }
  file(dir, codex.mcpServers, `${w}.mcpServers`);
  file(dir, codex.skills, `${w}.skills`);
}

if (claude) {
  if (claude.name !== codex?.name) fail("claude plugin.json name differs from codex plugin.json");
  if (claude.version !== codex?.version) fail("claude plugin.json version differs from codex plugin.json");
  str(claude, "description", 4000, "claude plugin.json");
}

if (mcp) {
  const servers = Object.entries(mcp.mcpServers ?? {});
  if (servers.length !== 1) fail(".mcp.json must declare exactly one server");
  for (const [n, s] of servers) {
    if (s.type !== "http") fail(`.mcp.json ${n}.type must be "http"`);
    if (s.url !== "https://mcp.getnextleg.com/mcp") fail(`.mcp.json ${n}.url must be the public Nextleg MCP URL`);
    if (s.headers || s.env || s.clientSecret || s.bearer_token_env_var) fail(`.mcp.json ${n} must carry no headers or secrets`);
  }
}

// server.json for the MCP Registry must agree with the plugin and point at files in this repo.
const server = readJson("server.json");
if (server) {
  if (!/^io\.github\.nextleg\/[a-zA-Z0-9._-]+$/.test(server.name ?? "")) fail("server.json name must be io.github.nextleg/*");
  if ((server.description ?? "").length > 100) fail("server.json description is over the registry's 100 chars");
  const remote = server.remotes ?? [];
  if (remote.length !== 1 || remote[0].type !== "streamable-http" || remote[0].url !== "https://mcp.getnextleg.com/mcp") fail("server.json remotes must be the one streamable-http Nextleg MCP URL");
  if (JSON.stringify(remote).match(/header|secret|token/i)) fail("server.json remotes must carry no headers or secrets");
  for (const ic of server.icons ?? []) {
    const m = ic.src?.match(/^https:\/\/raw\.githubusercontent\.com\/nextleg\/plugins\/main\/(.+)$/);
    if (!m || !existsSync(join(root, m[1]))) fail(`server.json icon ${ic.src} must be a file in this repo on main`);
  }
}

// Every skill needs name + description front matter, and its name must match the folder.
const skillsDir = join(root, dir, "skills");
for (const d of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
  const f = join(skillsDir, d, "SKILL.md");
  if (!existsSync(f)) {
    fail(`skills/${d}/SKILL.md missing`);
    continue;
  }
  const fm = readFileSync(f, "utf8").match(/^---\n([\s\S]*?)\n---/);
  const name = fm?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  if (!name || !/^description:\s*\S/m.test(fm[1])) fail(`skills/${d}/SKILL.md needs name and description`);
  else if (name !== d) fail(`skills/${d}/SKILL.md name "${name}" must match its folder`);
}

for (const [label, m] of [["agents marketplace", agents], ["claude marketplace", cmarket]]) {
  if (!m) continue;
  if (!m.name) fail(`${label}: name required`);
  for (const p of m.plugins ?? []) {
    const path = p.source?.path ?? p.source;
    if (typeof path !== "string" || !path.startsWith("./")) fail(`${label}: ${p.name} source path must start with ./`);
    else if (!existsSync(join(root, path))) fail(`${label}: ${path} does not exist`);
    if (p.name !== codex?.name) fail(`${label}: plugin name differs from manifest`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log("manifests ok");
