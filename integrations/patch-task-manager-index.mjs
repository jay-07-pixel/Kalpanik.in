#!/usr/bin/env node
/**
 * Idempotently wire kalpanikActivate into server/src/index.js (ESM).
 * Usage: node patch-task-manager-index.mjs /root/Task_manager_acs/server/src/index.js
 */
import fs from "node:fs";

const indexPath = process.argv[2];
if (!indexPath) {
  console.error("Usage: node patch-task-manager-index.mjs <path/to/server/src/index.js>");
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error(`Not found: ${indexPath}`);
  process.exit(1);
}

const importLine =
  'import { registerKalpanikSubscriptionActivate } from "../kalpanikActivate.js";';
const registerLine = "registerKalpanikSubscriptionActivate(app);";

let content = fs.readFileSync(indexPath, "utf8");
let changed = false;

if (!content.includes("registerKalpanikSubscriptionActivate")) {
  const importMatches = [...content.matchAll(/^import .+$/gm)];
  if (importMatches.length === 0) {
    console.error("No import statements found — patch manually.");
    process.exit(1);
  }
  const lastImport = importMatches[importMatches.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;
  content = `${content.slice(0, insertAt)}\n${importLine}${content.slice(insertAt)}`;
  changed = true;
}

if (!content.includes(registerLine)) {
  const jsonUse = "app.use(express.json());";
  const idx = content.indexOf(jsonUse);
  if (idx === -1) {
    console.error("Could not find app.use(express.json()) — add registerKalpanikSubscriptionActivate(app) after it manually.");
    process.exit(1);
  }
  const insertAt = idx + jsonUse.length;
  content = `${content.slice(0, insertAt)}\n${registerLine}${content.slice(insertAt)}`;
  changed = true;
}

if (changed) {
  fs.writeFileSync(indexPath, content);
  console.log(`Patched ${indexPath}`);
} else {
  console.log(`Already patched: ${indexPath}`);
}
