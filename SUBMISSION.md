# VoteTrue Submission

## Live URLs

- Frontend URL: `https://votetrue-frontend-b7s5qa47aa-el.a.run.app`
- Backend URL: `https://votetrue-backend-b7s5qa47aa-el.a.run.app`
- Health Check URL: `https://votetrue-backend-b7s5qa47aa-el.a.run.app/api/v1/health`
- API Docs URL: disabled in production

Do not paste API keys or service-account JSON into this file.

## Judge Highlights

- WhatsApp Forward Verification Engine, not a generic chatbot.
- RAG grounded in official ECI documents.
- Honest similarity-based confidence scoring.
- `UNVERIFIABLE` fallback when source context is weak or missing.
- Two-layer prompt-injection defense.
- Optional Google login with guest-first access.
- Redis/MemoryStore-ready rate limiting and cache for Cloud Run scalability.
- Google services: Gemini, embeddings, Vision OCR, Cloud Run, Cloud Build, Secret Manager, Cloud Logging, Google Identity Services.

## What to Test

1. Open `/verify`, upload an election-related WhatsApp forward screenshot, and review the claim-by-claim verdict cards powered by `/api/v1/verify-forward`.
2. Open `/ask`, ask `What ID can I use to vote?`, and confirm the answer includes ECI source chips.
3. Open `/myths` and review the static myths library with official verdicts.

## Google Services Used

| Service | What it does in VoteTrue |
| --- | --- |
| Gemini 1.5 Flash | Generates grounded answers and claim verdicts |
| Gemini text-embedding-004 | Embeds ECI document chunks and user questions |
| Cloud Vision API | OCR for WhatsApp forward screenshots |
| Cloud Run | Hosts frontend and backend services |
| Cloud Build | Builds and deploys container images |
| Secret Manager | Stores GEMINI_API_KEY securely |
| Cloud Logging | Captures production logs and abuse warnings |
| Container Registry | Stores deployment container images |

## Prompt Engineering Summary

- Neutrality enforcement prevents voting recommendations or party/candidate endorsement.
- UNVERIFIABLE fallback behavior avoids hallucination when ECI context is insufficient.
- Two-layer injection protection combines backend keyword filtering with a Gemini input safety classifier.
- Confidence scores come from retrieval similarity metadata only, not hardcoded confidence floors.
- Redis-compatible MemoryStore support is available through `REDIS_URL` for Cloud Run-safe rate limiting and caching.
