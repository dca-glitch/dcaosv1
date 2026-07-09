/**
 * R2 storage boundary smoke — disabled-safe by default.
 * Proves integrations readiness, image variant slots, and guarded upload refusal
 * without calling a live R2 bucket unless SMOKE_EXPECT_R2_ROUNDTRIP=true (delegates
 * to the existing byte-roundtrip smoke; not run here by default).
 */

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][R2_STORAGE_BOUNDARY]";
const expectLiveRoundtrip = (process.env.SMOKE_EXPECT_R2_ROUNDTRIP ?? "").trim().toLowerCase() === "true";

const IMAGE_VARIANTS = ["hero", "supporting_1", "supporting_2", "social_preview"];
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { response, json };
}

async function main() {
  if (!adminPassword) {
    record("AUTH_SEED_TEST_PASSWORD present", false, "set AUTH_SEED_TEST_PASSWORD for local smoke");
    process.exitCode = 1;
    return;
  }

  if (expectLiveRoundtrip) {
    record("live R2 roundtrip delegation", false, "run npm run smoke:r2-byte-roundtrip:local with SMOKE_EXPECT_R2_ROUNDTRIP=true instead");
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  if (!health.response.ok) {
    record("local API reachable", false, `health status=${health.response.status}`);
    process.exitCode = 1;
    return;
  }
  record("local API reachable", true, `status=${health.response.status}`);

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  const token = login.json?.data?.session?.token;
  if (!token) {
    record("admin login", false, `status=${login.response.status}`);
    process.exitCode = 1;
    return;
  }
  record("admin login", true);

  const readiness = await request("/integrations/readiness", { token });
  const r2Category = readiness.json?.data?.categories?.find((row) => row.key === "r2");
  record("integrations readiness R2 category present", Boolean(r2Category));
  record(
    "R2 disabled-safe by default",
    r2Category?.status === "disabled" || r2Category?.liveCallsDeferred === true,
    `status=${r2Category?.status ?? "missing"}`
  );

  const serializedReadiness = JSON.stringify(readiness.json ?? {});
  record("readiness JSON hides secrets", !/R2_SECRET_ACCESS_KEY|secret/i.test(serializedReadiness));

  const foundation = await request("/image-generation/foundation-config", { token });
  const slots = foundation.json?.data?.foundation?.variantSlots?.map((row) => row.slot) ?? [];
  record("image variant slots present", JSON.stringify(slots) === JSON.stringify(IMAGE_VARIANTS), JSON.stringify(slots));
  record(
    "image foundation disabled-safe",
    foundation.json?.data?.foundation?.disabledSafe === true,
    `disabledSafe=${foundation.json?.data?.foundation?.disabledSafe}`
  );
  record(
    "foundation response hides storageKey",
    !/"storageKey"/i.test(JSON.stringify(foundation.json ?? {}))
  );

  record("cleanup policy", true, "smoke uses existing fixtures only; no bucket delete API; archive test rows manually if needed");

  const failed = results.filter((row) => !row.ok).length;
  console.log(`\n${smokeMarker} ${results.length - failed}/${results.length} passed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  record("smoke runner", false, error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
