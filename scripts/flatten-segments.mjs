// Next.js static export writes segment prefetch payloads as nested folders
// (route/__next.X/route/__PAGE__.txt), while the client router requests the
// flat dotted form (route/__next.X.route.__PAGE__.txt). Static hosts serve
// files as-is, so this step writes a flat copy of every segment payload.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = "out";
let copied = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) flatten(dir, full, name);
    else walk(full);
  }
}

function flatten(parent, segDir, segName) {
  const stack = [segDir];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) {
        stack.push(full);
        continue;
      }
      const rel = relative(segDir, full).split(sep).join(".");
      const target = join(parent, `${segName}.${rel}`);
      if (!existsSync(target)) {
        copyFileSync(full, target);
        copied++;
      }
    }
  }
}

if (existsSync(root)) walk(root);
console.log(`flatten-segments: wrote ${copied} flat segment files`);
