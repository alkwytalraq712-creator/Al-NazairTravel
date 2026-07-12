/**
 * OCR Provider abstraction.
 *
 * Priority chain (auto-detected from env):
 *   1. Google Cloud Vision   — if GOOGLE_VISION_API_KEY is set
 *   2. Azure Doc Intelligence — if AZURE_DOC_INTELLIGENCE_ENDPOINT + KEY are set
 *   3. OpenAI Vision         — if OPENAI_API_KEY is set (GPT-4o vision)
 *   4. Tesseract             — always available as final fallback
 */

import type { OcrProvider, OcrResult, StructuredPassport } from './types.js';

// ─── Shared OpenAI client config ──────────────────────────────────────────────
// Prefer the Replit-managed OpenAI integration (proxy — no personal quota).
// Only use it when BOTH base URL and key are present; otherwise fall back to a
// personal OPENAI_API_KEY. Keeps client init consistent with isAvailable().
function resolveOpenAIConfig(): { baseURL?: string; apiKey: string } {
  const aiBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const aiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (aiBase && aiKey) return { baseURL: aiBase, apiKey: aiKey };
  return { apiKey: process.env.OPENAI_API_KEY ?? '' };
}

/** Returns a valid YYYY-MM-DD string, or '' if the input isn't one. */
function normalizeIsoDate(d: unknown): string {
  if (typeof d !== 'string') return '';
  const t = d.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : '';
}

// ─── Google Cloud Vision Provider ─────────────────────────────────────────────

class GoogleVisionProvider implements OcrProvider {
  readonly name = 'google-vision';

  isAvailable(): boolean {
    return !!process.env.GOOGLE_VISION_API_KEY;
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const apiKey = process.env.GOOGLE_VISION_API_KEY!;

    const b64 = image.toString('base64');
    const body = {
      requests: [
        {
          image: { content: b64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      throw new Error(`Google Vision API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text: string; pages?: Array<{ confidence?: number }> };
      }>;
    };

    const annotation = data.responses?.[0]?.fullTextAnnotation;
    if (!annotation) throw new Error('Google Vision: no text found');

    const rawText = annotation.text ?? '';
    const confidence = Math.round(
      ((annotation.pages?.[0]?.confidence ?? 0.9) * 100),
    );

    return { rawText, confidence, provider: this.name, durationMs: Date.now() - start };
  }
}

// ─── Azure Document Intelligence Provider ─────────────────────────────────────

class AzureProvider implements OcrProvider {
  readonly name = 'azure-doc-intelligence';

  isAvailable(): boolean {
    return !!(
      process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT &&
      process.env.AZURE_DOC_INTELLIGENCE_KEY
    );
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT!.replace(/\/$/, '');
    const apiKey = process.env.AZURE_DOC_INTELLIGENCE_KEY!;
    const apiVersion = '2024-07-31-preview';

    // Analyze using prebuilt-idDocument model
    const analyzeUrl = `${endpoint}/documentintelligence/documentModels/prebuilt-idDocument:analyze?api-version=${apiVersion}&outputContentFormat=text`;

    const analyzeRes = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: image,
    });

    if (!analyzeRes.ok) {
      throw new Error(`Azure analyze start error: ${analyzeRes.status}`);
    }

    const operationUrl = analyzeRes.headers.get('Operation-Location');
    if (!operationUrl) throw new Error('Azure: no Operation-Location returned');

    // Poll until done
    interface AzurePollResult { status: string; analyzeResult?: { content?: string } }
    let result: AzurePollResult | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(operationUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      });
      result = (await pollRes.json()) as AzurePollResult;
      if (result.status === 'succeeded' || result.status === 'failed') break;
    }

    if (!result || result.status !== 'succeeded') {
      throw new Error(`Azure analysis ${result?.status ?? 'timed out'}`);
    }

    const rawText = result.analyzeResult?.content ?? '';
    return { rawText, confidence: 90, provider: this.name, durationMs: Date.now() - start };
  }
}

// ─── OpenAI Vision Provider ────────────────────────────────────────────────────

class OpenAIVisionProvider implements OcrProvider {
  readonly name = 'openai-vision';

  isAvailable(): boolean {
    // Prefer the Replit-managed OpenAI integration (no personal quota limits).
    return !!(
      (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) ||
      process.env.OPENAI_API_KEY
    );
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI(resolveOpenAIConfig());

    const b64 = image.toString('base64');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an ICAO 9303 passport OCR engine.
Transcribe EVERY character you can see on this passport image, exactly as it appears.
Pay special attention to the MRZ zone (bottom two lines of machine-readable text).
Include the full MRZ lines verbatim.
Output plain text only — no JSON, no markdown, no commentary.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${b64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content ?? '';
    if (!rawText) throw new Error('OpenAI Vision returned empty text');

    return { rawText, confidence: 88, provider: this.name, durationMs: Date.now() - start };
  }

  /**
   * Structured extraction — the reliable path for vision LLMs. Instead of
   * transcribing a character-perfect MRZ (which GPT-4o cannot do consistently),
   * we ask it to read the printed passport fields and MRZ semantically and
   * return normalized JSON.
   *
   * Contract:
   * - returns a StructuredPassport when a passport was read;
   * - returns null ONLY when the model is confident the image is NOT a passport
   *   (explicit {"isPassport":false}) — a true semantic negative;
   * - THROWS on a recoverable read failure (missing/invalid JSON, empty result)
   *   so the service can fall back to the text/MRZ path instead of hard-failing
   *   a possibly-valid passport on benign model/format drift.
   */
  async extractStructured(image: Buffer): Promise<StructuredPassport | null> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI(resolveOpenAIConfig());
    const b64 = image.toString('base64');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a passport data extraction engine. Read this passport image carefully, INCLUDING the Machine Readable Zone (MRZ) — the two lines of monospaced text at the bottom.

Return ONLY a compact JSON object (no markdown, no commentary) with EXACTLY these keys:
{"isPassport":true,"passportType":"P","passportNumber":"","surname":"","givenNames":"","nationality":"","issuingCountry":"","sex":"","dateOfBirth":"","dateOfIssue":"","dateOfExpiry":"","placeOfBirth":""}

Rules:
- Convert every date to ISO format YYYY-MM-DD (e.g. "14 JAN 1990" -> "1990-01-14"). For 2-digit years, birth dates are in the past and expiry dates are within ~10 years of today.
- Prefer the MRZ for passport number, dates, nationality and sex when the printed fields are unclear.
- "nationality" and "issuingCountry": full English country name (e.g. "IRAQ").
- "sex": one of "M", "F", or "X".
- Use "" for any field you truly cannot read — do NOT guess.
- If this image is NOT a passport, or no passport data is readable, return exactly {"isPassport":false}.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${b64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    // No JSON at all → recoverable (let the caller fall back), not a verdict.
    if (!match) throw new Error('structured extraction: no JSON object in model output');

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(match[0]);
    } catch {
      throw new Error('structured extraction: unparseable JSON');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('structured extraction: JSON was not an object');
    }
    // Explicit, confident "not a passport" — the ONLY true semantic negative.
    if (data.isPassport === false) return null;

    const sex = String(data.sex ?? '').trim().toUpperCase();
    const structured: StructuredPassport = {
      passportType: String(data.passportType ?? 'P').toUpperCase().slice(0, 1) || 'P',
      passportNumber: String(data.passportNumber ?? '').replace(/\s/g, '').toUpperCase(),
      surname: String(data.surname ?? '').trim().toUpperCase(),
      givenNames: String(data.givenNames ?? '').trim().toUpperCase(),
      nationality: String(data.nationality ?? '').trim(),
      issuingCountry: String(data.issuingCountry ?? '').trim(),
      gender: sex === 'M' ? 'M' : sex === 'F' ? 'F' : sex === 'X' ? 'X' : '',
      dateOfBirth: normalizeIsoDate(data.dateOfBirth),
      passportIssueDate: normalizeIsoDate(data.dateOfIssue),
      passportExpiry: normalizeIsoDate(data.dateOfExpiry),
      placeOfBirth: String(data.placeOfBirth ?? '').trim(),
    };

    // Empty shell (model claimed a passport but read nothing usable) → recoverable:
    // throw so the caller can try the text/MRZ path rather than reject outright.
    if (!structured.passportNumber && !structured.surname && !structured.givenNames) {
      throw new Error('structured extraction: no usable fields read');
    }
    return structured;
  }
}

// ─── Tesseract Provider ────────────────────────────────────────────────────────

class TesseractProvider implements OcrProvider {
  readonly name = 'tesseract';

  isAvailable(): boolean {
    return true; // always available as final fallback
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const { createWorker } = await import('tesseract.js');
    const { join } = await import('path');

    // In a pnpm workspace, esbuild bundles this file but cannot bundle the
    // Tesseract worker script (it's spawned as a separate Node.js process).
    // Resolve it explicitly from the workspace root's pnpm store so the path
    // survives esbuild bundling. process.cwd() = artifacts/api-server/ at runtime.
    const workerPath = join(
      process.cwd(),
      '../../node_modules/.pnpm/tesseract.js@7.0.0/node_modules/tesseract.js/src/worker-script/node/index.js',
    );

    const worker = await createWorker('eng', 1, {
      workerPath,
      logger: () => undefined, // suppress progress logs
    });
    await worker.setParameters({
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<./-: ',
      preserve_interword_spaces: '1',
    });

    const { data } = await worker.recognize(image);
    await worker.terminate();

    const rawText = data.text ?? '';
    const confidence = Math.round(data.confidence ?? 60);

    return { rawText, confidence, provider: this.name, durationMs: Date.now() - start };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const PROVIDERS_IN_PRIORITY: OcrProvider[] = [
  new GoogleVisionProvider(),
  new AzureProvider(),
  new OpenAIVisionProvider(),
  new TesseractProvider(),
];

/**
 * Returns the highest-priority available OCR provider.
 * Always returns something (Tesseract is always available).
 */
export function selectOcrProvider(): OcrProvider {
  return PROVIDERS_IN_PRIORITY.find(p => p.isAvailable())!;
}

/**
 * Returns ALL available providers in priority order.
 * Use this for sequential fallback: try each until one succeeds.
 */
export function getAvailableProviders(): OcrProvider[] {
  return PROVIDERS_IN_PRIORITY.filter(p => p.isAvailable());
}

export {
  GoogleVisionProvider,
  AzureProvider,
  OpenAIVisionProvider,
  TesseractProvider,
};
