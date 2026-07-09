# AI Agent Roles & Task Taxonomy — DCA OS Lite

**Status:** Approved (G55, 2026-07-09)  
**Registry:** `apps/api/src/core/ai-agent-role-registry.ts`  

---

## Agent roles

| Role | Task types | Approval | Live provider | Default provider (disabled) |
|------|------------|----------|---------------|----------------------------|
| Research Agent | `research_pack` | No | No | Perplexity placeholder |
| SEO Planning Agent | `seo_plan` | No | No | OpenAI placeholder |
| Content Drafting Agent | `article_outline`, `article_draft` | Yes | No | OpenAI placeholder |
| Rewrite / Localization Agent | `rewrite_polish` | Yes | No | OpenAI mini placeholder |
| Compliance Review Agent | `compliance_review` | Yes | No | Anthropic placeholder |
| Report Narrative Agent | `report_narrative` | Yes | No | OpenAI placeholder |
| Image Prompt Agent | `image_prompt` | Yes | No | OpenAI placeholder |
| Image Generation Agent | `image_generation` | Yes | No | Manual/stock default |
| Vision Technical QA Agent | `vision_technical_qa` | Yes | No | Vision QA placeholder |
| Local Disabled-Safe Agent | `local_deterministic` | No | No | Local deterministic (enabled) |

---

## Per-role material rules

### Research Agent
- **Allowed:** client brief, approved business facts, public research
- **Forbidden:** medical data, billing data, before/after assets

### SEO Planning Agent
- **Allowed:** client brief, approved facts, public research, SEO plan
- **Forbidden:** medical data, billing data, before/after

### Content Drafting Agent
- **Allowed:** brief, facts, SEO plan, outline, public research
- **Forbidden:** medical data, billing data, before/after
- **Output:** review-ready draft

### Compliance Review Agent
- **Allowed:** drafts, social copy, facts, SEO plan
- **Forbidden:** medical data, billing data

### Vision Technical QA Agent
- **Allowed:** before/after assets only (when role enabled)
- **Forbidden:** medical data, billing data
- **Note:** technical QA only; no outcome enhancement

### Local Disabled-Safe Agent
- **Allowed:** all marketing-safe material classes except forbidden medical/billing
- **Purpose:** default execution path when live providers disabled

---

## Disabled-safe fallback

All roles fall back to `local_deterministic` when configured providers are disabled.

Shared types: `packages/shared/src/ai-orchestrator-lite.ts`
