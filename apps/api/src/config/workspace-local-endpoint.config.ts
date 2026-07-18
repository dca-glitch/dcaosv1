/** P1.4b: this switch is intentionally local and default-off. */
export function isWorkspaceLocalEndpointEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV !== "development" || env.WORKSPACE_LOCAL_ENDPOINT_ENABLED !== "true") return false;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return url.hostname === "127.0.0.1" && url.port === "5434";
  } catch {
    return false;
  }
}
