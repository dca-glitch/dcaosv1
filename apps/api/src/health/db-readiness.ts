import type { PrismaClient } from "@prisma/client";
import { createPrismaClient, disconnectPrismaClient } from "../../../../packages/data/src/client";

export type DbReadinessStatus = "ready" | "not_ready";

export interface DbReadinessResult {
  status: DbReadinessStatus;
  message: string;
}

export interface DbReadinessDependencies {
  timeoutMs?: number;
}

async function runConnectivityQuery(client: PrismaClient): Promise<void> {
  await client.$queryRawUnsafe("SELECT 1 AS ready");
}

function toReadinessMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Unable to reach PostgreSQL using DATABASE_URL. ${error.message}`;
  }

  return "Unable to reach PostgreSQL using DATABASE_URL. Check that the local database is running and DATABASE_URL points to the expected host and port.";
}

export async function probeDbReadiness(
  _dependencies: DbReadinessDependencies = {}
): Promise<DbReadinessResult> {
  const client = createPrismaClient();

  try {
    await runConnectivityQuery(client);
    return {
      status: "ready",
      message: "Database connectivity is healthy."
    };
  } catch (error) {
    return {
      status: "not_ready",
      message: toReadinessMessage(error)
    };
  } finally {
    await disconnectPrismaClient(client);
  }
}
