# AI Modules

## Current Status

DCA OS includes two admin-operated AI Delivery foundations:

- **AI Delivery**: Project/Brief/Workflow/Deliverable/Review — admin-operated research coordination with AI SEO workflow shell/status summary, content plan generation, WordPress draft preparation support, Google Docs export foundation, and monthly report handoff (full WordPress publishing integration gated until credential block).
- **Market Intelligence**: Research/Insight — admin-operated competitive and market research with bounded deterministic analysis; locally closed and smoke validated.

Both modules are admin-operated, bounded, and review-gated. Local deterministic paths exist; live provider execution remains guarded/config-gated. Human review is required before any publish or client-visible output.

**Client Portal MVP** is required now (not deferred) for Puriva client delivery. Portal shows client-safe summaries only — no raw prompts, workflow runs, MI internals, AI costs, or credentials.

## Design Rule

AI features support human-reviewed workflows.

AI helps prepare, summarize, draft, classify, and recommend.

Critical business actions remain reviewable and require admin approval (and client review where required before publication).

External integrations (live provider execution, WordPress publish, client export) remain guarded gates. AI SEO admin-operated MVP work is in place: research requests, manual/admin research sources, research summaries, summary-to-brief application, content plan actions, workflow-generated content plans, and draft handoff stay admin-controlled until approved for client visibility.

## Current AI Workflow Pattern

1. input source (project, research, or market data)
2. bounded context collection (project sources, research context)
3. default local deterministic AI processing (mock/bounded generation; no external calls unless an approved provider path is explicitly env-enabled)
4. draft output (insights, deliverables, content)
5. human admin review
6. admin approval decision (client review where required — e.g. Puriva)
7. publication, Google Docs export, or Client Portal visibility (WordPress publish gated until credential block 4–5)
8. audit record

## Guarded External Integrations

- **Live provider execution** — OpenRouter path exists for text execution but remains env opt-in and production-disabled unless explicitly approved; direct OpenAI/Gemini adapters remain future only.
- **WordPress publishing integration** — gated until encryption/redaction for credentials tested; WordPress draft preparation foundation exists; required for Puriva MVP delivery path after block 4–5.
- **Google Docs export** — deliverable export foundation exists (admin); client-visible final export links required for Puriva MVP.
- **Client Portal** — MVP required now; client-safe MI summary, SEO status, deliverables, publishing handoff/status, final reports only.
- **Autonomous monitoring** — admin-operated only, no autonomous agents

## AI Delivery scope (agency clients first)

AI Delivery serves agency clients first. Required outputs:

- Final deliverables
- Google Docs export
- Website publishing / WordPress workflow
- Monthly report final client view

Technical implementation variant may be selected only within safe existing architecture and documented constraints.

## Future AI Enhancements

Potential future AI modules may include:

- AI task assistant
- AI content planner
- AI SEO research
- AI draft generator
- AI report generator
- AI client dashboard insights
- AI finance assistant
- AI CRM assistant
- AI workflow automation
- AI knowledge base
- AI module builder assistant

## Integration Direction

AI modules integrate with:

- module registry
- permissions (tenant-scoped, owner/admin for operations; client role for portal-safe views)
- tenant context
- audit logs
- dashboards
- reports
- Client Portal (client-safe summaries and final deliverables only)
