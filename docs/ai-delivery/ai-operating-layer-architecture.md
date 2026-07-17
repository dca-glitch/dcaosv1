# AI Operating Layer Architecture

**Status:** Target architecture  
**Scope:** Documentation only  
**Implementation note:** This document is not an implementation plan by itself.  
**Provider note:** No provider enablement is implied.  
**Environment note:** No staging or production change is implied.

## Glossary

| Term | Meaning |
|---|---|
| AI Knowledge Base | Unified memory layer for typed, scoped, versioned, reviewed knowledge. |
| Context Builder | Service that assembles safe, tenant-scoped context for a specific AI run. |
| Context Snapshot | Immutable record of the exact context sources, versions, budget, and hash used for a run. |
| Workflow Template | Versioned definition of inputs, context rules, model tier, output schema, review gates, and budget policy. |
| Workflow Run | One execution of a workflow template for a tenant/client/project context. |
| Promotion Event | Admin-approved conversion of final output or insight into reusable knowledge. |
| Client AI Brain | Admin surface for what the system knows about a client. |
| AI Workbench | Admin surface for choosing, previewing, running, and reviewing AI workflows. |
| AI Governance & History | Admin surface for run history, cost, provider status, safety, approvals, and audit trail. |

## 1. Purpose

The AI Operating Layer is the central controlled AI system inside DCA OS Lite. It coordinates client knowledge, project and month context, research, prompt presets, AI role execution, provider calls, quality review, cost controls, and final deliverables.

This layer is not a chatbot feature, a folder of loose prompts, or an uncontrolled autonomous agent system. It is an admin-operated architecture for agency work. It should make AI useful across AI SEO, market intelligence, content production, WordPress draft preparation, monthly reporting, client onboarding analysis, competitor analysis, image brief generation, future Revenue Hub AI, and reusable client knowledge.

The target architecture must support powerful internal orchestration while keeping the product simple for operators. Admin should not be forced to maintain many disconnected AI configuration screens. The system should expose three clear working areas:

1. **Client AI Brain** - what the system knows about this client.
2. **AI Workbench** - what the admin wants AI to do now, with which context, cost, and review path.
3. **AI Governance & History** - what happened, what it cost, who approved it, and whether it is safe.

## 2. Product Philosophy

The AI Operating Layer follows these product rules:

- **Admin-triggered AI by default.** AI work starts from an explicit admin action or explicitly approved workflow event.
- **Human-in-the-loop.** AI output is draft material until reviewed, edited, rejected, approved, or promoted by an admin.
- **Approved memory only.** Raw research, pasted content, client input, provider output, and AI suggestions do not become reusable memory automatically.
- **No automatic publishing.** WordPress and other publishing paths may prepare drafts or handoff packages only when explicitly scoped and reviewed.
- **Client-visible output is final/approved only.** Clients see approved briefs, approved summaries, final content, final images, final reports, published links, and approved archives.
- **Admin-only internals stay admin-only.** Raw prompts, provider logs, failed generations, internal costs, raw source dumps, internal comments, and technical run history are not client-facing.
- **Reduce work, do not create data maintenance burden.** The architecture may contain many knowledge types, workflow rules, and review states, but the UI must present them as unified guided surfaces.

The UX principle is: **powerful system underneath, simple working surface for admin.**

## 3. User Mental Model

### Client AI Brain

Client AI Brain answers: **"What does the system know about this client?"**

It should present one unified knowledge system with filters, not many disconnected forms. It may include:

- client facts;
- services and products;
- brand voice and style rules;
- target audiences;
- approved research;
- competitor notes;
- image style rules;
- content examples;
- report insights;
- performance learnings;
- forbidden claims;
- approved links;
- project or monthly context.

Admin should be able to filter by type, status, scope, source, expiry, confidence, and whether an item is allowed in prompts. Raw and unapproved items can exist for review, but approved prompt-eligible knowledge should be visually distinct.

### AI Workbench

AI Workbench answers: **"What do I want AI to do now, with which context, cost, and review path?"**

It is where admin runs workflows:

- choose tenant/client/project/month context;
- choose workflow template;
- preview selected context;
- see missing-context warnings;
- see estimated cost and model tier;
- run AI when guardrails pass;
- review output;
- edit output;
- approve, reject, or request revision;
- promote approved output to knowledge when appropriate;
- export, prepare a deliverable, prepare a WordPress draft, or attach output to a report.

The Workbench should not expose raw prompt engineering as the primary interface. It should show a human-readable context preview and workflow checklist.

### AI Governance & History

AI Governance & History answers: **"What happened, what did it cost, who approved it, and is it safe?"**

It should cover:

- usage and cost by tenant, client, workflow, model, and provider;
- provider status and disabled/enabled state;
- hard limits and threshold alerts;
- run history and immutable context snapshots;
- errors and retries;
- review queue;
- audit trail;
- promotion history;
- client visibility decisions.

## 4. Core Architecture Overview

The AI Operating Layer consists of seven core subsystems.

| Subsystem | Purpose | Responsibilities | Must not do |
|---|---|---|---|
| AI Knowledge Base | Unified memory layer | Store typed, scoped, versioned, reviewed knowledge | Treat raw input as approved memory |
| AI Context Builder | Build safe context for each run | Select eligible knowledge, enforce isolation, budget tokens, snapshot context | Leak cross-client data or let external content override rules |
| AI Workflow Engine | Execute bounded workflow lifecycles | Preflight, queue, run, parse, review, convert output | Self-initiate uncontrolled work |
| AI Role System | Controlled role behaviors inside workflows | Apply role-specific instructions and output contracts | Act as autonomous agents |
| AI Review & Quality System | Human review and quality gates | Checklists, approvals, revisions, promotions | Rubber-stamp unreviewed output |
| AI Governance / Cost / Provider Control | Safety and spend control | Provider abstraction, budgets, model tiers, audit | Make live provider calls without guardrails |
| AI Feedback Loop | Learn safely from outcomes | Convert approved outcomes and performance into knowledge | Auto-learn silently from drafts or failures |

## 5. AI Knowledge Base

The AI Knowledge Base is the unified memory layer. It replaces any confusing split between a Research Library and Approved Knowledge Notes. Research, client facts, approved notes, examples, report insights, and learnings are all knowledge items with type, scope, status, source, confidence, expiry, versioning, approval state, and allowed prompt use.

### Knowledge types

Initial target knowledge types include:

- `client_fact`
- `brand_voice`
- `target_audience`
- `product_service`
- `offer`
- `competitor`
- `research_note`
- `market_insight`
- `seo_keyword_group`
- `content_example`
- `image_style`
- `report_insight`
- `performance_learning`
- `forbidden_claim`
- `approved_link`
- `project_context`
- `industry_note`

### Conceptual fields

Each knowledge item should support:

| Field | Purpose |
|---|---|
| `tenant_id` | Tenant ownership and isolation |
| `client_id` | Client ownership when applicable |
| `project_id` | Project/month scope when applicable |
| `scope` | `system`, `client`, `project`, or `industry` |
| `type` | Knowledge type |
| `title` | Human-readable name |
| `summary` | Short operator-facing summary |
| `body` / `details` | Full knowledge content |
| `status` | `raw`, `reviewed`, `approved`, `expired`, `archived`, `replaced` |
| `source_type` | Admin entry, client input, research, final deliverable, report, analytics, etc. |
| `source_url` | Optional source URL |
| `source_date` | Date the source was observed/published |
| `confidence` / `reliability` | Reliability marker |
| `expires_at` / `evergreen` | Staleness control |
| `created_by` | Creator user/system reference |
| `reviewed_by` | Reviewer reference |
| `approved_by` | Approver reference |
| `version` | Version number |
| `replaced_by` | Replacement item/version reference |
| `created_at`, `updated_at`, `approved_at` | Timeline |
| `allowed_for_prompt` | Whether Context Builder can use it by default |
| `client_visible` | Whether it can be exposed to client-facing surfaces |

### Knowledge rules

- `raw` means collected but not trusted or reusable.
- `reviewed` means a human has reviewed the item, but it is not automatically prompt-eligible.
- `approved` means the item can be used by Context Builder if `allowed_for_prompt = true` and it is not expired, archived, or replaced.
- `expired` means not used by default; it can only be included with warning and explicit admin choice.
- `archived` and `replaced` mean not used by default.
- `raw` is never automatically used in production prompts.
- Only `approved` + `allowed_for_prompt = true` is eligible for default Context Builder use.
- `expired` items are excluded unless explicitly included with warning.
- `archived` and `replaced` items are not used.
- Project-scoped items do not leak into other projects unless promoted to client or industry scope.
- Industry-scoped items must be anonymized and explicitly approved.
- Final approved content may become a style/content example only after admin promotion.
- Raw research, raw client input, pasted web content, and AI suggestions must not automatically become reusable memory.

## 6. Source of Truth Hierarchy

When information conflicts, the system uses this priority order:

1. System safety and governance rules.
2. Admin-approved client facts.
3. Admin-approved brand voice/style rules.
4. Admin-approved current project/month context.
5. Admin-approved knowledge base items.
6. Approved final deliverables.
7. Raw research or client-provided raw input.
8. One-off admin instruction for this run.
9. AI suggestion.

Raw research must not override approved client facts. AI suggestions never override approved data. One-off admin instructions can guide a run, but they do not become memory automatically. If a one-off instruction conflicts with safety rules, tenant isolation, forbidden claims, or approved client facts, the system should warn or block the run.

## 7. AI Context Builder

Context Builder is the heart of the AI Operating Layer. It turns workflow intent into a safe, scoped, structured context packet.

### Inputs

Context Builder receives:

- workflow type/template and version;
- tenant;
- client;
- project/month when applicable;
- requesting user;
- requested output;
- selected sources or explicit inclusions;
- one-off admin instruction;
- model/provider tier request.

### Responsibilities

Context Builder must:

- verify permissions and tenant/client/project isolation;
- determine required context sources for the workflow;
- fetch only approved eligible knowledge by default;
- apply the source-of-truth hierarchy;
- enforce per-workflow token budgets;
- compress or summarize long context items;
- trim low-priority context before high-priority context;
- build a structured context packet;
- sanitize untrusted content against prompt injection;
- clearly separate system/workflow instructions from external content;
- produce an understandable context preview for admin;
- estimate cost before any provider call;
- store an immutable context snapshot for the AI run.

### Context source categories

| Category | Examples |
|---|---|
| System rules | Safety, governance, client visibility, no publishing rules |
| Workflow preset | Role, task, output requirements, checklist, schema |
| Client core | Approved facts, domain, services, positioning |
| Brand voice | Approved tone, style, forbidden phrasing |
| Target audience | Approved personas, segments, intent |
| Monthly/project context | Current campaign, target month, deliverable scope |
| Approved knowledge items | Research notes, competitor notes, market insights, SEO keyword groups |
| Selected research sources | Explicit raw/selected source snippets with warnings |
| Output format/schema | Required JSON or document structure |
| One-off admin instruction | Run-specific guidance that is not memory |

### Token budgeting

Each workflow preset should define max token budgets per source category.

| Source category | Priority and budget behavior |
|---|---|
| System/governance rules | High priority, fixed, never removed |
| Workflow preset | High priority, fixed, never removed |
| Output schema | High priority, fixed, never removed |
| Brand voice | High priority, compressed before trimming |
| Client facts | High priority, compressed before trimming |
| Project/month context | Medium/high priority |
| Target audience | Medium/high priority |
| Knowledge notes | Top-k relevant only |
| Raw research | Explicit inclusion only, marked untrusted |
| Run history | Normally excluded unless workflow requires it |

### Trimming behavior

- Never remove safety rules.
- Never remove output schema.
- Prefer compressed brand/client context over dropping it.
- Drop low-relevance knowledge before high-priority context.
- Exclude expired knowledge by default.
- Warn admin when context is incomplete, trimmed, stale, or includes raw/unapproved material.

### Missing context severity

| Severity | Meaning |
|---|---|
| `info` | Useful context is missing, but the workflow can continue. |
| `warning` | Output quality may be reduced; admin should review the warning before running. |
| `blocking` | Workflow must not run until required context is supplied or explicitly overridden if the workflow allows override. |

### Context snapshot

Each AI run should preserve:

- workflow preset version;
- knowledge item IDs and versions used;
- brand voice version;
- target audience IDs and versions;
- project context version;
- model/provider tier;
- token and cost estimate;
- final structured context hash;
- optional redacted prompt snapshot with controlled TTL.

Raw prompt retention should be configurable, redacted where possible, and admin-only.

## 8. AI Workflow Engine

The Workflow Engine executes deterministic and bounded workflows. It is not autonomous. A workflow should not branch endlessly, self-initiate new work, publish content, or create provider cost without explicit admin-triggered or explicitly scoped behavior.

A **workflow output** is any AI-generated result from a run. A **deliverable** is reviewed/approved output prepared for a client, project, export path, or publishing handoff. Not every workflow output becomes a deliverable.

### Lifecycle

1. Draft/preflight.
2. Context build.
3. Cost check.
4. Queued.
5. Running.
6. Provider response.
7. Parsing/validation.
8. Pending review.
9. Approved/rejected/revision requested.
10. Converted to deliverable/knowledge/report/draft.
11. Archived.

### Workflow families

- Client onboarding analysis.
- SEO content plan.
- Article brief generator.
- Article draft generator.
- Article editor/polisher.
- Image brief generator.
- Competitor summary.
- Market intelligence brief.
- Monthly report draft.
- WordPress draft preparation.
- Revenue insight later.

### Workflow template definition

Each workflow should define:

- required inputs;
- optional inputs;
- required knowledge types;
- required review gates;
- output schema;
- model tier;
- max input tokens;
- max output tokens;
- budget cap;
- retry policy;
- fallback policy;
- client visibility;
- promotion rules.

## 9. AI Role System

AI roles are controlled role definitions inside workflows. They are not autonomous agents.

| Role | Purpose | Allowed inputs | Output type | Review requirement | Model tier guidance |
|---|---|---|---|---|---|
| Researcher | Summarize and structure sources | Approved context, explicitly selected raw sources | Research notes, source lists | Required before promotion | Cheap/standard |
| Strategist | Produce positioning, campaign, or plan logic | Approved client/project/market context | Strategy brief | Required | Standard/premium |
| SEO Planner | Build keyword groups, outlines, internal link suggestions | Approved SEO/client context | Content plan or outline | Required | Standard |
| Writer | Draft articles/pages | Approved brief, brand, audience, SEO context | Draft content | Required | Premium for final drafts |
| Editor | Improve draft quality | Draft plus approved context | Edited draft/comments | Required | Standard/premium |
| Brand Guardian | Check tone and forbidden claims | Draft plus brand rules | Issues/checklist | Required | Cheap/standard |
| Fact Checker | Identify unsupported claims | Draft plus approved sources | Fact-check notes | Required | Standard/reasoning when complex |
| Visual Director | Generate image brief | Article section, image style, brand rules | Image prompt/brief/alt text | Required | Standard |
| Publisher Assistant | Prepare platform-neutral or WordPress draft package | Approved deliverable and publication target metadata | Draft preparation result | Required before publishing | Cheap/standard |
| Report Analyst | Draft monthly report insights | Approved metrics, deliverables, MI handoff | Report narrative | Required | Standard/premium |
| Revenue Analyst | Future Revenue Hub insights | Approved revenue/client data | Revenue insight | Required | Premium/reasoning |

Roles do not self-initiate. Roles do not publish. Roles do not browse or mutate systems unless the workflow explicitly allows it and admin approves. Roles operate only inside approved workflow boundaries.

## 10. Human Review and Quality System

The Review Queue is a first-class system. AI output remains draft until a human review action occurs.

### Review actions

- approve;
- reject;
- request revision;
- edit;
- approve as final;
- promote to knowledge;
- mark as reusable example;
- export or prepare deliverable;
- archive.

### Quality checklist examples

For article/content:

- matches brief;
- matches target audience;
- follows brand voice;
- avoids forbidden claims;
- has SEO structure;
- includes CTA;
- does not sound generic;
- includes meta title/description if required;
- includes image brief if required;
- no unsupported claims.

For research:

- source list included;
- source dates included;
- facts separated from inference;
- confidence/reliability visible;
- expiry suggested;
- admin can approve, promote, or reject.

For reports:

- metrics are grounded;
- recommendations are justified;
- no overpromising;
- client-ready tone;
- final links/deliverables included.

For images:

- follows image style;
- safe for brand;
- no forbidden visuals;
- includes alt text;
- matches article section/purpose.

## 11. Governance and Safety

Mandatory governance rules:

- admin-triggered by default;
- no uncontrolled background agents;
- no automatic publishing;
- no client access to raw AI internals;
- live providers disabled until explicitly configured;
- hard cost limits;
- review required before client-visible output;
- no secrets in prompts or logs;
- no cross-client knowledge mixing;
- tenant/client/project isolation enforced in services and tests.

### Data categories

| Category | Handling |
|---|---|
| Public | May be used when relevant and source is tracked |
| Client confidential | Use only for that tenant/client/project with review |
| Internal agency | Admin-only; include only when necessary |
| Financial | Minimize, summarize, and restrict by workflow |
| PII | Avoid unless required and justified |
| Secrets/credentials | Never send to providers |
| Provider-safe anonymized summaries | Preferred for sensitive analytics/industry learning |

### External provider restrictions

Never send:

- credentials or API keys;
- raw secrets;
- unnecessary PII;
- sensitive raw financial records;
- unrelated client data;
- internal logs with sensitive stack traces;
- cross-tenant context.

### Prompt injection protections

- sanitize untrusted source content;
- clearly separate system instructions from external content;
- strip or neutralize known injection patterns;
- never allow external content to override system or workflow rules;
- mark source content as untrusted context;
- reject or warn on sources that attempt to instruct the model to ignore rules or reveal hidden context.

## 12. Tenant and Client Isolation

Tenant and client isolation is a core architecture requirement.

- Every knowledge item belongs to a tenant and usually a client/project.
- Context Builder must filter by tenant, client, and project before relevance ranking.
- Provider calls must include only the current tenant/client/project context.
- Cache keys must include tenant, client, workflow, and context version identifiers.
- Tests must prove no cross-client context leakage.
- Industry-level knowledge must be anonymized and explicitly approved before reuse.
- Client Portal access remains per Client; clients see final approved deliverables and reports only.

Row Level Security can be considered as a defense-in-depth option if compatible with the current Prisma/PostgreSQL architecture, but this document does not require immediate RLS implementation.

## 13. Cost Control and Provider Strategy

### Provider architecture

DCA OS should have its own provider abstraction layer. The application should depend on internal provider interfaces, not directly on a single external provider throughout workflow code.

- OpenRouter can be used for model experimentation and multi-provider flexibility.
- Direct provider APIs may be preferred for stable high-value workflows where pricing, reliability, data terms, or quality are better controlled.
- LiteLLM can be considered later for gateway/routing/spend tracking if provider count and usage justify the operational overhead.
- Ollama/local models on a CPU VPS are lab/test only, not the primary production content generation strategy.
- The VPS should run orchestration, queue, cache, context building, and application services, not heavy local LLM inference.

### Model tiers

| Tier | Use |
|---|---|
| test/free | Development checks and non-client-safe experiments |
| cheap | Classification, tags, simple extraction, meta variants |
| standard | Summaries, research synthesis, outlines |
| premium | Final content, high-value reports, complex analysis |
| reasoning | Rare strategic/complex tasks only with explicit approval |

### Cost controls

- hard monthly limits per tenant and client;
- per-run max input/output tokens;
- per-workflow budget caps;
- estimated cost before provider call;
- actual cost after provider response;
- both estimated and actual cost should be stored;
- differences between estimated and actual cost should be visible in usage and reporting;
- stop before provider call if over limit;
- threshold alerts;
- cost report by client, workflow, model, and provider;
- retry/fallback limits;
- no background cost-incurring work unless explicitly approved.

## 14. Queue, Workers, Cache and Observability

Long AI runs should be asynchronous through queue/worker architecture.

- API creates the run and stores the preflight state.
- Worker processes context build, provider call, parsing, validation, and review handoff.
- Retries are bounded by workflow policy.
- Failed runs are visible to admin with safe error summaries.
- Cache can store reusable context packets or expensive intermediate outputs.
- Cache keys must include tenant/client/workflow/context version.
- Observability should track model, provider, latency, tokens, cost, errors, workflow, and run state.

Langfuse may be useful for AI observability and prompt traces if operationally justified. It must not replace the DCA OS audit trail. Raw prompt retention must be controlled, redacted where possible, and governed by TTL.

Postgres remains the source of truth. Normal relational models should come first. `pgvector` can be added later when semantic retrieval is needed. Qdrant should only be introduced if scale justifies a separate vector system.

## 15. Feedback Loop and Learning from Outcomes

The system learns through controlled promotion, not autonomous memory.

1. AI output is generated as a draft.
2. Admin edits or rejects the draft.
3. Final version is approved.
4. Client accepts/rejects or published performance appears later.
5. Admin can promote final output or an insight into the Knowledge Base.
6. Performance insights can become approved learning.
7. Heavily edited AI outputs can reveal style gaps and improve workflow presets.
8. Rejected outputs can inform prompt/template improvements.

Performance-learning sources may include:

- ranking change;
- Google Search Console clicks/impressions;
- GA traffic or engagement;
- client acceptance/rejection;
- conversion/inquiry data;
- admin edit volume.

Rules:

- no automatic memory promotion;
- no self-learning from failed outputs;
- no silent update to client profile;
- no cross-client learning unless anonymized and explicitly approved.

## 16. Client Visibility Boundary

Clients can see:

- approved brief;
- approved research summary if published;
- approved content plan;
- final articles/images;
- published links;
- final monthly report;
- approved archive.

Clients must not see:

- raw prompts;
- provider logs;
- raw run history;
- failed AI generations;
- cost metadata;
- internal notes;
- raw crawl/source dump;
- unapproved research;
- admin-only comments.

## 17. UI/UX Direction

The AI Operating Layer should follow the current Botanical Light product UI direction: readable, professional, workflow-oriented, responsive, and aligned to current shared UI primitives.

Design principles:

- compact, readable admin screens;
- not oversized cards;
- not too many bright buttons;
- dim/professional controls;
- strong hierarchy;
- status chips;
- clear missing-context warnings;
- one primary action per workflow stage;
- avoid forcing admin through many forms;
- prefer guided setup and AI-assisted onboarding;
- context preview should be understandable, not a raw technical prompt dump.

Suggested areas:

1. Client AI Brain.
2. AI Workbench.
3. AI Review Queue.
4. AI Governance & History.
5. Provider & Cost Settings.

## 18. Data Model Direction

This section is conceptual only. It does not define migrations.

| Entity | Purpose | Key fields / relationships |
|---|---|---|
| `AiKnowledgeItem` | Unified memory item | tenant, client, project, scope, type, title, summary, status, source, confidence, expiry, allowed_for_prompt, client_visible |
| `AiKnowledgeItemVersion` | Version history | item, version, body/details, changed_by, approved_by, timestamps |
| `AiWorkflowTemplate` | Workflow definition | key, name, family, default model tier, status |
| `AiWorkflowTemplateVersion` | Immutable workflow config | required inputs, context budgets, output schema, review gates, retry/fallback policy |
| `AiContextSnapshot` | Immutable run context record | workflow version, knowledge versions used, context hash, cost estimate, redacted prompt reference |
| `AiWorkflowRun` | Execution record | tenant, client, project, workflow, status, role, provider, model, context snapshot, result |
| `AiRunUsage` | Token/cost usage | run, provider, model, input tokens, output tokens, estimated/actual cost |
| `AiReview` | Human review state | run/output, reviewer, status, notes, checklist, approved_at |
| `AiQualityChecklist` | Workflow-specific checklist | workflow version, checklist items, required flags |
| `AiProviderConfig` | Provider abstraction config | provider key, enabled state, default tiers, limits, safe status; never stores secrets in client-visible data |
| `AiCostBudget` | Spend control | tenant/client/workflow/model budgets, thresholds, reset period |
| `AiFeedbackSignal` | Outcome signal | run/output, edit distance, client response, performance metric, rejection reason |
| `AiPromotionEvent` | Knowledge promotion trail | source output, target knowledge item/version, promoter, approval metadata |

Relationships to existing concepts should preserve current architecture:

- `Tenant` remains the top-level boundary.
- `Client` remains the operational unit, aligned with the client/domain model.
- `Project` and existing `AiDeliveryProject` provide project/month delivery context.
- Existing content plan items, content drafts, article images, deliverables, deliverable reviews, WordPress draft preparation, publication logs, research requests/sources/summaries, Market Intelligence handoffs, monthly reports, and metric snapshots should map into workflow outputs, review records, or promotable knowledge sources.
- Final deliverables and monthly reports can become client-visible only through approved/final status rules.

Existing AI Delivery entities should be integrated, not replaced immediately:

- `AiDeliveryProject`
- `AiDeliveryWorkflowRun`
- `AiDeliveryResearchRequest`
- `AiDeliveryResearchSource`
- `AiDeliveryResearchSummary`
- `AiDeliveryContentPlan`
- `AiDeliveryContentDraft`
- `AiDeliveryArticleImage`
- `AiDeliveryDeliverable`
- `AiDeliveryDeliverableReview`
- `AiDeliveryMonthlyReport`

## 19. Staging and Provider Enablement Policy

- Staging health must be verified before live provider configuration.
- Environment inventory should list required key names only, never values.
- Live providers are disabled by default.
- Provider keys are stored in staging environment only for staging; production configuration requires separate explicit approval.
- No production mutation without explicit approval.
- Cost guardrails must be verified before smoke tests that can call providers.
- Smoke should be staging-safe and admin-triggered.
- Provider failures must degrade to visible admin errors, not silent retries that create uncontrolled cost.

## 20. Risks and Mitigations

| Risk | Impact | Mitigation | Architecture location |
|---|---|---|---|
| Context bloat | High cost, weak outputs | Token budgets, compression, top-k retrieval, trimming warnings | Context Builder |
| User friction/data maintenance burden | Admin avoids system | Unified Client AI Brain, guided setup, promotion from reviewed work | UX, Knowledge Base |
| Tenant leakage | Critical confidentiality failure | Tenant/client filters, cache key scoping, tests, audit | Context Builder, services, cache |
| Stale knowledge | Wrong recommendations | expiry, confidence, review dates, expired exclusion | Knowledge Base |
| Memory poisoning | Bad raw input becomes trusted | raw/reviewed/approved status, no auto-promotion | Knowledge Base, Review |
| Prompt injection | Rules bypassed or data leaked | sanitize sources, separate instructions, untrusted content labels | Context Builder |
| Uncontrolled cost | Budget overrun | hard limits, estimates, caps, retries/fallback limits | Governance/Cost |
| Provider outage | Workflow failure | provider abstraction, fallback policy, visible failed runs | Provider Control, Workflow Engine |
| Rubber-stamp human review | Low-quality client output | checklists, required review gates, reviewer audit | Review & Quality |
| Generic AI output | Weak deliverables | brand voice, examples, quality checks, feedback loop | Knowledge Base, Review, Feedback |
| Raw prompt/PII leakage | Privacy/security issue | redaction, TTL, provider restrictions, admin-only logs | Governance, Observability |
| Overdependence on OpenRouter | Vendor/routing risk | provider abstraction, direct provider option | Provider Strategy |
| VPS bottleneck | Slow system | VPS handles orchestration, not heavy inference | Queue/Workers/Provider Strategy |
| Overuse of local models | Poor output/performance | local CPU models are lab/test only | Provider Strategy |

## 21. Implementation Phases Without MVP Narrowing

This architecture describes the full target system. Implementation should still proceed in safe dependent layers:

1. **Architecture/docs alignment.** Map current docs, schema, API, and UI to this architecture.
2. **Knowledge Base + Context Builder foundation.** Implemented locally: `AiKnowledgeItem`, `AiKnowledgeItemVersion`, `AiContextSnapshot`, admin-only knowledge CRUD/promotion endpoints, dry-run `POST /api/v1/ai-operating-layer/context-preview` (no provider call), approved-only default selection, prompt-injection sanitization, and focused smoke `npm.cmd run smoke:ai-knowledge-context`.
3. **Workflow Engine + Review Queue.** Standardize lifecycle, review gates, and output contracts.
4. **Provider abstraction + cost governance.** Add provider interfaces, budgets, estimates, and usage records.
5. **AI Workbench UI.** Build the admin-triggered surface with context preview and cost warnings.
6. **Feedback loop + quality system.** Add promotion events, quality checklists, and outcome signals.
7. **Advanced retrieval/vector search if needed.** Add pgvector or external vector storage only when relational retrieval is insufficient.
8. **External integrations and advanced workflows.** Expand WordPress draft preparation, reporting, Revenue Hub AI, and other workflows after guardrails are proven.

These phases are not a narrowing of the product ambition. They are the dependency order for building the full system safely.

## 22. Non-Goals

- No uncontrolled autonomous agents.
- No automatic publishing.
- No client access to internals.
- No raw internet data as memory without approval.
- No local heavy LLM inference on a CPU VPS as the primary production strategy.
- No third-party low-code tool as the core workflow brain.
- No cross-client shared memory unless anonymized and explicitly approved.
- No provider enablement without explicit configuration and cost guardrails.
- No secrets in prompts, logs, docs, or client-visible outputs.

## 23. Open Questions

- What is the exact retention period for raw or redacted prompt snapshots?
- Should Langfuse be introduced immediately or later after internal audit records are mature?
- Should production route through OpenRouter, direct providers, or a hybrid strategy by workflow tier?
- When is pgvector needed, and what retrieval quality threshold justifies adding it?
- How should industry-level anonymized knowledge be modeled and approved?
- What are the default budget caps per tenant, client, workflow, and model tier?
- When should each AI output type become visible in the Client Portal?
- Which workflows require client review in addition to admin review?
- What edit-distance or outcome signals should trigger preset improvement work?
- Which provider terms/data-retention settings are acceptable for client-confidential workflows?

## 24. Recommended Next Step

Run read-only repo discovery against this architecture, map existing code/docs to the target subsystems, and then decide the first implementation block.

The first implementation block should be chosen only after confirming what already exists for AI Delivery projects, briefs, workflow runs, research requests/sources/summaries, content plans, content drafts, article images, deliverables, deliverable reviews, WordPress draft preparation, Market Intelligence handoff, monthly reports, audit logs, tenant/client isolation, and provider/cost guardrails.