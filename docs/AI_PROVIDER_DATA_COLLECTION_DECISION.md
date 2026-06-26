# AI Provider and Data Collection Decision

Status: Approved direction for future implementation. Documentation only.

Current state: AI Delivery defaults to local deterministic execution. An OpenRouter-capable text gateway path exists for AI Delivery workflow execution, but it is opt-in only when `AI_TEXT_GATEWAY=openrouter` plus required OpenRouter key/model config are present. Without that explicit config, execution remains local deterministic. Production should remain local/deterministic unless a live provider block is explicitly approved.

## 1. Text AI Gateway

OpenRouter is the first text-model gateway/router for future AI Delivery and AI module text execution.

OpenAI is the primary text model family through OpenRouter.

Gemini is the secondary long-context and reviewer model family through OpenRouter.

Direct OpenAI or Gemini adapters are future fallback/escape-hatch options only. They are not the first implementation target.

## 2. Image AI

Adobe Firefly is the preferred future direct image-generation and refinement provider.

OpenAI image generation may be evaluated later as a fallback if Firefly does not cover a required workflow.

Midjourney remains manual/admin-only inspiration. It is not a backend integration target for DCA OS Lite.

## 3. Data Collection And Scraping

The internal Data Collection Engine is primary.

Tavily is the free-first search and source-discovery option.

Firecrawl is the scrape/crawl fallback.

Apify is reserved for hard targets only.

AI models do not scrape directly. They summarize, classify, and extract from text collected by the data collection layer.

## 4. MVP Execution Rules

AI workflow execution is admin-triggered only. No autonomous or background runs are approved for MVP.

A later implementation block should store the provider and model used per run.

Errors, logs, and cost metadata should be stored before production scaling.

Clients see only client-safe transformed outputs.

Prompts, raw sources, provider details, and internal workflow logs remain admin-only.

## 5. Config Boundary

The API may expose a safe planning configuration boundary for AI provider settings. This boundary may name `local` and `openrouter` as supported text gateway values and may expose non-secret booleans such as whether an OpenRouter API key is configured.

This boundary must not require provider secrets at startup, print provider secrets, import provider SDKs, or change the default local deterministic execution behavior. OpenRouter runtime calls are allowed only through the guarded execution adapter when explicitly env-enabled with the required gateway, key, and model config.

## 6. Explicit Exclusions

This closure does not add SDK dependencies, API keys, schema changes, migrations, Client Portal behavior, deployment, commits, or pushes. It does not enable live provider calls by default; OpenRouter remains opt-in by env config and should remain off for production unless explicitly approved.
