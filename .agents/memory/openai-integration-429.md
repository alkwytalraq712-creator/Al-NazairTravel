---
name: OpenAI 429 — integration vs personal key
description: A 429 "exceeded your current quota" from OpenAI usually means code fell through to a personal OPENAI_API_KEY with no credits because the Replit-managed integration env vars were missing.
---

# OpenAI 429 "exceeded your current quota"

If OpenAI calls suddenly fail with `429 You exceeded your current quota` (a *billing* error, not rate limiting), suspect provisioning, not code:
- The OpenAI client resolves config by preferring the Replit-managed integration (`AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`) and falling back to a personal `OPENAI_API_KEY`.
- When the integration env vars are absent (integration removed / not added), the code falls through to the personal key — whose account may have $0 credits → 429.

**Fix:** re-provision the Replit-managed OpenAI integration (`setupReplitAIIntegrations({ providerSlug: "openai" })`), then RESTART the consuming workflow so the fresh env vars are injected.

**Why:** avoids chasing a phantom code bug; the 429 text is verbatim from OpenAI about billing. Prefer the Replit integration (billed to Replit credits) over a personal key.

**How to apply:** the api-server injects env only at process start and rebuilds on restart, so new env is NOT picked up live — a restart is mandatory. Never test AI via ShellExec/sandbox `process.env` (stale); test through the restarted workflow. If a user insists on their own key, they must add OpenAI credits.
