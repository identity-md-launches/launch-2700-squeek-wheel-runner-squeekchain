// Build = copy. The site in site/ is plain HTML + JS + canvas and runs as-is;
// this script only produces the committed static export in dist/ and checks
// that every local asset URL in the HTML is relative and resolves.
import { cpSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "site");
const out = join(root, "dist");

rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true, filter: (p) => !p.endsWith(".d.ts") });

const problems = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) checkHtml(p);
  }
}
function checkHtml(file) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(url)) continue;
    if (url.startsWith("/")) { problems.push(`${file}: absolute URL ${url}`); continue; }
    const target = join(dirname(file), url.split(/[?#]/)[0]);
    if (!existsSync(target)) problems.push(`${file}: missing ${url}`);
  }
}
walk(out);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
let bytes = 0, files = 0;
(function size(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) size(p); else { bytes += statSync(p).size; files++; }
  }
})(out);
console.log(`dist/ built: ${files} files, ${bytes} bytes, all local URLs relative and present`);
