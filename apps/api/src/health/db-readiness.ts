export type DbReadinessStatus = "unknown" | "ready" | "not_ready";

export interface DbReadinessResult {
  status: DbReadinessStatus;
  message: string;
}

export interface DbReadinessDependencies {
  timeoutMs?: number;
}

export async function probeDbReadiness(
  _dependencies: DbReadinessDependencies = {}
): Promise<DbReadinessResult> {
  return {
    status: "unknown",
    message: "DB readiness skeleton is not mounted."
  };
}
