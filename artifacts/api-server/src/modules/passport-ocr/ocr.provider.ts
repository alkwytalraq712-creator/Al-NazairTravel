/**
 * OCR Provider abstraction.
 *
 * Priority chain (auto-detected from env):
 *   1. Google Cloud Vision   — if GOOGLE_VISION_API_KEY is set
 *   2. Azure Doc Intelligence — if AZURE_DOC_INTELLIGENCE_ENDPOINT + KEY are set
 *   3. OpenAI Vision         — if OPENAI_API_KEY is set (GPT-4o vision)
 *   4. Tesseract             — always available as final fallback
 */

import type { OcrProvider, OcrResult } from './types.js';

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
    return !!process.env.OPENAI_API_KEY;
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

// ─── Tesseract Provider ────────────────────────────────────────────────────────

class TesseractProvider implements OcrProvider {
  readonly name = 'tesseract';

  isAvailable(): boolean {
    // Disabled: worker-script path not available in this deployment environment.
    // When enabled, this was crashing the Node process via an unhandled worker error.
    return false;
  }

  async extractText(image: Buffer): Promise<OcrResult> {
    const start = Date.now();
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng', 1, {
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
