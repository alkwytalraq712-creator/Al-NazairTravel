---
name: Passport OCR with vision LLMs
description: Why passport OCR uses semantic structured JSON extraction (not a strict MRZ regex) and the extractStructured outcome contract that drives fallback vs hard-fail.
---

# Passport OCR with vision LLMs

## Don't require a pixel-perfect MRZ from a vision LLM
GPT-4o (and peers) cannot reliably transcribe the 44-char ICAO 9303 MRZ character-for-character. An OCR path that depends on a strict MRZ regex to populate fields will frequently yield empty fields → false "invalid passport" rejections on perfectly good scans.

**Instead:** ask the model to read printed fields + MRZ *semantically* and return normalized JSON (dates → YYYY-MM-DD, "" for unreadable, an explicit not-a-passport flag). Treat that structured result as a **trusted source** — do NOT hard-fail on missing fields; the user edits them in the UI. Keep a raw-text/MRZ path only as a fallback (and for providers without structured support, e.g. Tesseract).

## extractStructured outcome contract (fallback vs hard-fail)
A provider's structured extractor must distinguish two failure kinds, or benign model/format drift will reject valid passports:
- **return null** ONLY when the model is *confident the image is not a passport* (explicit negative). The service maps this to a fast, clean rejection (Arabic 422) and does not try other providers on the same image.
- **throw** on any *recoverable* read failure (missing/invalid JSON, empty shell). The service catches it and falls back to the text/MRZ path (or next provider) instead of hard-failing.

**Why:** an earlier version returned null for BOTH cases and the service treated null as mandatory-fail, so JSON format drift on a valid passport surfaced as PASSPORT_INVALID. Splitting "semantic negative" (null) from "recoverable" (throw) recovers those scans.

**How to apply:** any new OCR provider that adds structured extraction must follow this null-vs-throw contract, and the text/MRZ fallback must stay reachable. Note the controller stops the provider chain on a PASSPORT_INVALID (non-transient) error.
