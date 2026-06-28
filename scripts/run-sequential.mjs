/**
 * Run shell commands sequentially and stop on first non-zero exit.
 * Used instead of bash-style && chains so npm scripts stay PowerShell-safe.
 */

import { spawnSync } from "node:child_process";

const commands = process.argv.slice(2);

if (commands.length === 0) {
  console.error("Usage: node scripts/run-sequential.mjs <command> [<command> ...]");
  process.exit(1);
}

for (const command of commands) {
  console.log(`\n> ${command}\n`);

  const result = spawnSync(command, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
}
