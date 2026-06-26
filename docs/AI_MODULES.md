# AI Modules

## Current Status

DCA OS v1 now includes two admin-only AI Delivery foundations:

- **AI Delivery**: Project/Brief/Workflow/Deliverable/Review - admin-operated research coordination with AI SEO workflow shell/status summary, content plan generation, and WordPress draft preparation support (full publishing integration gated).
- **Market Intelligence**: Research/Insight - admin-operated competitive and market research with bounded deterministic analysis; locally closed and smoke validated.

Both modules are admin-operated, bounded, and review-gated. Local deterministic paths exist; live provider execution remains guarded/config-gated. Human review is required before any publish or use.

## Design Rule

AI features support human-reviewed workflows.

AI helps prepare, summarize, draft, classify, and recommend.

Critical business actions remain reviewable and require admin approval.

External integrations (live provider execution, WordPress publish, client export) remain guarded gates. AI SEO admin-operated MVP work is in place: research requests, manual/admin research sources, research summaries, summary-to-brief application, content plan actions, workflow-generated content plans, and draft handoff stay admin-controlled.

## Current AI Workflow Pattern

1. input source (project, research, or market data)
2. bounded context collection (project sources, research context)
3. default local deterministic AI processing (mock/bounded generation; no external calls unless an approved provider path is explicitly env-enabled)
4. draft output (insights, deliverables, content)
5. human admin review
6. admin approval decision
7. publication or archiving (deferred: WordPress, export, client portal)
8. audit record

## Deferred External Integrations

- **Live provider execution** - OpenRouter path exists for text execution but remains env opt-in and production-disabled unless explicitly approved; direct OpenAI/Gemini adapters remain future only.
- **WordPress publishing integration** - gated until encryption/redaction for credentials tested; WordPress draft preparation foundation exists
- **Client Portal** - gated until admin foundation stable
- **Export/Reporting** - gated until audit and admin workflow proven
- **Autonomous monitoring** - admin-operated only, no autonomous agents

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
- permissions (tenant-scoped, owner/admin-only)
- tenant context
- audit logs
- dashboards
- reports
