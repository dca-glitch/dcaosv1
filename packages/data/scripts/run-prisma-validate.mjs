import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "prisma.cmd" : "prisma";
const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ?? "postgresql://dca_os_validation:validation@localhost:5432/dca_os_validation"
};

const result = spawnSync(command, ["validate", "--schema", "prisma/schema.prisma"], {
  env,
  shell: true,
  stdio: "inherit"
});

process.exit(result.status ?? 1);
