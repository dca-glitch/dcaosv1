# WordPress Mock Publication Foundation

**Status:** WordPress disabled/mock publish endpoint, service scaffold, and UI action foundation is complete.

> **Architecture update (2026-06-26):** Tenant-level WordPress config is **legacy**. Approved target model: **PublicationTarget per Client** (domain), multiple subdomains, encrypted credentials per target. See [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](../architecture/CLIENT_DOMAIN_OPERATING_MODEL.md) and implementation blocks 2–5 in [`docs/ROADMAP.md`](../ROADMAP.md).

**Branch:** `feature/ai-delivery-project-brief-foundation`

**Implementation Commits:**
- `ba89e65 Add WordPress provider service interface scaffold only`
- `4be967d Add disabled/mock WordPress publish endpoint wired to the WordPress provider scaffold`
- `5abcd71 Add admin UI action for disabled/mock WordPress publish endpoint`
- `a6ab51d Add WordPress tenant config API`
- `56290cd Add WordPress tenant config UI`

---

## What Is Implemented Now

### Backend Service Scaffold

**File:** `apps/api/src/services/wordpress.service.ts` (~250 lines)

**Exported Functions:**
- `validateAiDeliveryWordPressConfig(siteUrl: string): AiDeliveryWordPressValidationResult` — validates site URL format only; no external calls
- `publishAiDeliveryDeliverableToWordPress(config: AiDeliveryWordPressSiteConfig, request: AiDeliveryWordPressPublishRequest): AiDeliveryWordPressPublishResult` — mock function that returns provider-disabled result
- `getAiDeliveryWordPressConfigForTenant(tenantId: string): Promise<AiDeliveryWordPressSiteConfig | null>` — mock function returning null; future: reads from TenantSetting

**Behavior:**
- No external WordPress API calls
- No credentials read from env or TenantSetting
- No credential storage in code
- Mock functions return clear `provider_disabled` status
- TypeScript types only; no runtime secret handling

**Response Structure:**
```json
{
  "ok": false,
  "status": "provider_disabled",
  "externalPostId": null,
  "postUrl": null,
  "editUrl": null,
  "message": "No external WordPress call was made; real WordPress integration is future block."
}
```

### Backend API Endpoint

**Endpoint:**
```
POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/publish-wordpress
```

**Behavior:**
- Owner/admin only (RBAC enforced)
- Tenant-scoped: validates project and deliverable ownership
- Cross-project guard: rejects unauthorized project/deliverable linkage
- Calls WordPress provider service mock function
- Returns provider-disabled/mock result
- **Does NOT call WordPress**
- **Does NOT create external post**
- **Does NOT read/store credentials**
- **Does NOT modify TenantSetting**

**Request:**
```json
{
  "projectId": "<id>",
  "deliverableId": "<id>"
}
```

**Response (Disabled Mock):**
```json
{
  "ok": false,
  "status": "provider_disabled",
  "externalPostId": null,
  "postUrl": null,
  "editUrl": null,
  "message": "No external WordPress call was made; real WordPress integration is future block."
}
```

**Files Modified:**
- `apps/api/src/core/core.runtime.ts` — Added `publishAiDeliveryDeliverableToWordPress()` function (~90 lines)
- `apps/api/src/controllers/coreController.ts` — Added handler import and endpoint handler
- `apps/api/src/routes/core.ts` — Added route definition with RBAC guards

### Frontend UI

**Location:** `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx`

**Button:** "Test WordPress publish"
- Visible on deliverable detail card (next to "Prepare WordPress Draft" button)
- Admin/owner only
- Calls local `/publish-wordpress` endpoint
- Shows loading state while publishing
- Displays result panel inline in modal/panel
- Shows provider-disabled status with clear disabled messaging
- Does NOT imply real publication succeeded
- Does NOT show external post ID or URL
- No external calls to WordPress

**Result Display:**
- Status badge shows `provider_disabled`
- Message clearly states: "provider disabled" / "no external post created"
- External post ID field shows null
- Post URL field shows null
- Edit URL field shows null

**User Workflow:**
1. Navigate to AI Delivery > Project
2. Select deliverable
3. Click "Test WordPress publish" button
4. View provider-disabled test result inline
5. Confirm no external post was created

**Files Modified:**
- `apps/web/src/pages/ai-delivery/AiDeliveryPage.tsx` — Added UI state (targetId, error, result), handler function, button, and result display panel (~88 lines)

### WordPress Tenant Config API

**Files:** `apps/api/src/core/core.runtime.ts`, `apps/api/src/routes/core.ts`

**Endpoints:**
```
GET /api/v1/tenant/wordpress-config
POST /api/v1/tenant/wordpress-config
```

**Behavior:**
- Owner/admin only (RBAC enforced via `requireRole("owner", "admin")`)
- Tenant-scoped: reads/writes TenantSetting for current authenticated tenant
- TenantSetting key: `ai_delivery_wordpress_connection`
- Non-secret config shape stored:
  ```json
  {
    "siteUrl": "https://my-site.wordpress.com",
    "siteSlug": "my-site",
    "wordPressComSite": true
  }
  ```
- Allowed fields: `siteUrl` (string), `siteSlug` (string, optional), `wordPressComSite` (boolean)
- Forbidden credential-like fields (40+ keywords): password, token, apiKey, secret, clientSecret, refreshToken, accessToken, bearerToken, authHeader, applicationPassword, etc.
  - Rejected with `400 WORDPRESS_CONFIG_INVALID` if any forbidden keyword present
  - Validation occurs before storage
- GET returns `{ ok: true, data: { config: WordPressConfig | null } }`
- POST validates, filters forbidden fields, normalizes URL (trims trailing slash), upserts TenantSetting, returns updated config
- Audit logging: records `WORDPRESS_CONFIG_UPDATED` action with metadata (siteUrlHost extracted from URL, not full URL)
- **No credentials read or stored**
- **No WordPress API verification**
- **No external calls**

**Response:**
```json
{
  "ok": true,
  "data": {
    "config": {
      "siteUrl": "https://my-site.wordpress.com",
      "siteSlug": "my-site",
      "wordPressComSite": true
    }
  }
}
```

**Runtime Functions Added (~162 lines):**
- `getAiDeliveryWordPressConfigForTenant(tenantId: string): Promise<WordPressConfig | null>` — reads TenantSetting or returns null
- `saveAiDeliveryWordPressConfigForTenant(tenantId: string, config: Partial<WordPressConfig>): Promise<WordPressConfig | null>` — validates, filters forbidden fields, upserts TenantSetting, logs audit action

**Files Modified:**
- `apps/api/src/core/core.runtime.ts` — Added ~162 lines for WordPress config get/save functions
- `apps/api/src/routes/core.ts` — Added GET/POST /api/v1/tenant/wordpress-config routes with RBAC guards

### WordPress Tenant Config Admin UI

**Location:** `apps/web/src/pages/company-profile/CompanyProfilePage.tsx` (integrated) and `apps/web/src/pages/company-profile/WordPressConfigPanel.tsx` (component)

**Panel:** Located in Company Profile settings page below company profile card

**Fields:**
- Site URL (text input, required) — e.g., "https://my-site.wordpress.com"
- Site Slug (text input, optional) — e.g., "my-site"
- WordPress.com Site (checkbox) — indicates WordPress.com vs self-hosted

**Clear Messaging:**
- "Non-secret WordPress site config only"
- "No credentials are stored"
- "No WordPress connection is verified"
- "Publishing remains disabled/mock until a future approved integration block"

**Behavior:**
- Loads current config from GET /api/v1/tenant/wordpress-config on page open (via loadProtectedState in App.tsx)
- Form UI in modal; save button triggers POST /api/v1/tenant/wordpress-config
- Shows loading state while saving
- Displays error messages if POST fails (e.g., "400 WORDPRESS_CONFIG_INVALID" if credential fields detected)
- Shows success confirmation on save
- Clears modal form state on close or success
- Admin/owner only

**Response Display:**
- No credential fields present in form
- No credential fields read from API response (typed as non-secret only)
- Backend rejects any credential-like fields at 400 before storage

**User Workflow:**
1. Admin navigates to Company Profile settings
2. Finds WordPress Config panel
3. Enters site URL, optional slug, WordPress.com checkbox
4. Clicks Save
5. Sees confirmation or error
6. Config persists in TenantSetting for tenant

**Files Created/Modified:**
- `apps/web/src/pages/company-profile/WordPressConfigPanel.tsx` — NEW (~100 lines): reusable component with form, modal, state management
- `apps/web/src/pages/company-profile/CompanyProfilePage.tsx` — Updated: imported WordPressConfigPanel, added props, rendered component
- `apps/web/src/App.tsx` — Updated: added wordPressConfig state, added handleSaveWordPressConfig handler, extended loadProtectedState to fetch WordPress config, passed props to CompanyProfilePage

### Testing & Validation

**API Smoke Coverage (Backend):**
- ✅ API smoke: valid request → provider-disabled mock result
- ✅ API smoke: invalid project/deliverable → 404
- ✅ API smoke: unauthorized user → 403
- ✅ API smoke: cross-project deliverable → 409/404 guard rejection
- ✅ API smoke: WordPress config save → 200
- ✅ API smoke: WordPress config get → 200
- ✅ API smoke: WordPress config persisted values verified
- ✅ API smoke: WordPress config rejects forbidden secret field → 400 WORDPRESS_CONFIG_INVALID
- ✅ Verify no external WordPress API call made
- ✅ Verify no post created in response

**UI Smoke Coverage (Browser):**
- ✅ UI smoke: button renders on admin deliverable
- ✅ UI smoke: button click calls API
- ✅ UI smoke: result panel displays with provider-disabled status
- ✅ UI smoke: no external post creation messaging
- ✅ UI smoke: status badge shows disabled state
- ✅ UI smoke: WordPress config panel renders in Company Profile
- ✅ UI smoke: WordPress config form accepts non-secret fields
- ✅ UI smoke: WordPress config saves to backend
- ✅ UI smoke: WordPress config displays clear non-secret messaging
- ✅ Git diff --check: passing
- ✅ npm.cmd run validate: passing
- ✅ npm.cmd run smoke:mvp:local: exit 0, WordPress config + Finance + Vendor + Bills tests PASSED

**Test Files:**
- `scripts/smoke-ai-delivery-reviews-local.mjs` — WordPress publish API and UI smoke tests

---

## What Is NOT Implemented Yet (Intentional Deferred)

| Feature | Why Deferred | Future Block |
|---|---|---|
| **Real WordPress API Integration** | Requires WordPress.com/self-hosted REST API contract, external HTTP calls, and credential design. | WordPress publish integration (future block) |
| **WordPress Credential Storage** | Needs secure secret management (vault, encrypted env, key rotation). Requires TenantSetting credential schema design. | Credential storage design (separate block) |
| **Credential Reading from TenantSetting** | Current mock functions return null. Future: must safely read tenant-scoped WordPress config without exposing secrets in logs/UI. | TenantSetting credential reads (future block) |
| **Actual Post Creation** | Mock returns `ok: false`. Real implementation must validate WordPress API response and persist external post ID/URL. | WordPress post creation (future block) |
| **WordPress Provider Error Handling** | Rate limits, network errors, authentication failures, invalid credentials, partial publish recovery. | Provider resilience (future block) |
| **External Post ID Persistence** | Current response returns null. Future: must store WordPress post ID, URL, and edit URL for deliverable tracking. | Post ID persistence (future block) |
| **Automatic Image Upload to WordPress** | Requires image hosting strategy (WordPress media library, CDN, or R2 reference). | Image hosting integration (future block) |
| **WordPress Category/Tag Sync** | Requires WordPress taxonomy mapping and verification. | Taxonomy management (future block) |
| **Publish Scheduling** | WordPress future/scheduled publish dates. | Scheduled publish (future block) |
| **WordPress Revisions & Rollback** | Handling WordPress post revisions and client-side rollback on error. | Revision management (future block) |

---

## Operator Handoff Notes

### What You Can Test Now

1. **Local Mock Publish Endpoint**
   - Run: `npm.cmd run smoke:ai-delivery-reviews`
   - Verify endpoint responds with provider-disabled mock result
   - Verify tenant/project/deliverable scoping is correct
   - Verify authorization (admin-only) is enforced
   - Verify cross-project guard rejects unauthorized requests

2. **WordPress Tenant Config API**
   - Run: `npm.cmd run smoke:mvp:local`
   - Verify GET /api/v1/tenant/wordpress-config returns current config or null
   - Verify POST /api/v1/tenant/wordpress-config saves non-secret config
   - Verify config persists across requests
   - Verify 400 response when credential-like fields detected
   - Verify audit logging records config updates

3. **UI Button & Result Display**
   - Start local web: `npm.cmd run dev:web`
   - Navigate to AI Delivery > Project > Deliverable
   - Click "Test WordPress publish" button
   - Verify result panel displays with provider-disabled status
   - Verify button is admin/owner only
   - Verify no external post ID/URL displayed
   - Verify disabled messaging is clear

4. **WordPress Config Admin Panel**
   - Start local web: `npm.cmd run dev:web`
   - Navigate to Company Profile (settings)
   - Find WordPress Config panel
   - Enter site URL, optional slug, WordPress.com checkbox
   - Verify form fields render correctly
   - Click Save
   - Verify success confirmation
   - Navigate away and return; verify config persisted
   - Verify clear copy shown: "non-secret config only", "no credentials stored", "no WordPress connection verified"

5. **Mock Service Validation**
   - Inspect `apps/api/src/services/wordpress.service.ts`
   - Verify no env var reads for credentials
   - Verify no TenantSetting credential reads (currently mock returns null)
   - Verify no external WordPress API calls
   - Verify mock functions return `ok: false, status: "provider_disabled"`

### What Is Intentionally NOT Tested (Not Implemented)

- Real WordPress.com or self-hosted POST request
- Credential reading from TenantSetting or env
- External post creation or ID assignment
- WordPress API error handling
- Image upload to WordPress
- Persistence of external post IDs
- Real WordPress connection verification
- Credential fields storage

### Next Steps for Real WordPress Integration

**Phase: WordPress Credential & API Design** (Future Block)
- Design secure credential storage in TenantSetting (encrypted, no plaintext logging)
- Document WordPress API contract (POST /wp-json/wp/v2/posts, required fields, error codes)
- Design tenant/project → WordPress account mapping (1:1, multi-site, or multi-account strategy)
- Design error handling and rollback for publish failures
- Document rate limiting and retry strategy

**Phase: WordPress Publish Implementation** (Future Block)
- Add TenantSetting reads for WordPress site URL and API credentials (no env var logging)
- Implement real WordPress API client (axios, node-fetch, or equivalent)
- Update `publishAiDeliveryDeliverableToWordPress()` to call real WordPress endpoint
- Add response validation and external post ID persistence
- Add UI workflow: prepare → review → publish → status tracking with post URL

**Phase: WordPress Provider Resilience** (Future Block)
- Implement exponential backoff for transient failures
- Add WordPress provider health check
- Implement partial publish recovery (if image upload fails, retry separately)
- Add async publish job queue for long-running operations
- Add admin UI for publish history and error recovery

**Phase: Image & Asset Hosting** (Future Block)
- Choose image hosting: WordPress media library, CDN, or R2 reference
- Implement image upload to chosen provider
- Add featured image assignment in WordPress draft
- Add fallback for missing images (placeholder or link reference)

---

## Credential & Secret Safety

**Critical:** The current mock publish endpoint and WordPress config API do NOT require or support WordPress credentials.

- ✅ No WordPress secrets are stored in DCA OS
- ✅ No WordPress API calls are made during mock publish or config operations
- ✅ No credentials are embedded in response, logs, or frontend
- ✅ No `.env` WordPress secrets are inspected or used
- ✅ No TenantSetting credential reads implemented yet
- ✅ WordPress config API stores ONLY non-secret tenant site config (siteUrl, siteSlug, wordPressComSite)
- ✅ WordPress config API explicitly rejects credential-like fields (password, token, apiKey, secret, etc.) at 400 WORDPRESS_CONFIG_INVALID
- ✅ Mock publish functions explicitly return provider-disabled status

**Future Real Integration Must:**
- Design and review credential storage policy BEFORE implementing TenantSetting credential reads
- Establish clear boundaries: non-secret config (this block) vs credentials (future separate block)
- Use secure secret management (not hardcoded, not in git, not in logs)
- Require explicit scope approval for credential integration
- Never expose WordPress secrets in frontend logs, UI, or response payloads
- Document password rotation and expiry strategy
- Implement audit logging for all credential access
- Add TenantSetting credential schema design separate from this non-secret config block

---

## Integration Testing Checklist

Before releasing real WordPress integration:

- [ ] **Credential Design** — TenantSetting WordPress config schema reviewed and approved
- [ ] **API Contract** — WordPress.com / self-hosted API contract verified and documented
- [ ] **Tenant Scoping** — WordPress account mapping strategy approved (1:1, multi-site, multi-account)
- [ ] **Error Handling** — Retry, rollback, and error reporting designed and documented
- [ ] **Live WordPress Test** — Test WordPress.com or self-hosted instance prepared
- [ ] **Smoke Coverage** — Real WordPress publish smoke tests written and passing
- [ ] **Rollback Plan** — Procedure for unpublishing or correcting WordPress posts documented
- [ ] **Security Review** — Credential handling, TenantSetting reads, and API calls reviewed for injection/auth risks
- [ ] **Rate Limiting** — WordPress API rate limits documented and enforced
- [ ] **Audit Logging** — All WordPress API calls and credential accesses logged securely

---

## Summary

WordPress mock publication foundation + non-secret config management provides a safe, credential-free baseline for testing the publish workflow and storing tenant site configuration locally. No external WordPress calls are made. No credentials are stored or read. The endpoint and UI clearly indicate disabled/mock status to prevent confusion with real publication.

**Completed Phases:**
1. ✅ WordPress provider service scaffold (mock functions, no credentials)
2. ✅ Mock publish endpoint wired to service (provider-disabled result)
3. ✅ Admin UI action for mock publish (disabled messaging)
4. ✅ Non-secret WordPress tenant config API (TenantSetting storage for siteUrl, siteSlug, wordPressComSite)
5. ✅ Admin UI panel for config (Company Profile settings, clear messaging)

Real WordPress API integration, credential storage, and external post persistence remain intentionally deferred. All deferred features require separate scope approval, security review, and explicit credential handling design. The mock foundation + non-secret config is sufficient for admin testing of the local publish workflow, config management, and endpoint contract validation.

**No commits performed. No secrets touched. No TenantSetting credential reads implemented. No external WordPress calls made. Non-secret config API only — credentials require separate future block.**

