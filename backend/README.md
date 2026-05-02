# VoteTrue Backend

FastAPI backend for VoteTrue, a WhatsApp misinformation firewall grounded in official Election Commission of India documents.

## Core Features

- Ask VoteTrue: RAG retrieval over ECI document chunks with Gemini 1.5 Flash answers.
- WhatsApp Forward Verification Engine: Google Cloud Vision OCR, Gemini claim extraction, and per-claim RAG verification.
- Myths & Facts: static frontend content; no backend AI dependency.

## Google Services

- Google Gemini API for generation and embeddings.
- Google Cloud Vision API for WhatsApp forward screenshot OCR.
- Google Cloud Logging in production.
- Google Secret Manager is the production source for credentials.
- Google Cloud Run target via Docker.

## Local Setup

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```
