import { describe, it, expect } from 'vitest';
import {
  GoogleVisionProvider,
  AzureProvider,
  OpenAIVisionProvider,
  TesseractProvider,
  selectOcrProvider,
} from '../ocr.provider.js';

describe('Provider availability', () => {
  it('GoogleVisionProvider is unavailable without env var', () => {
    const p = new GoogleVisionProvider();
    const orig = process.env.GOOGLE_VISION_API_KEY;
    delete process.env.GOOGLE_VISION_API_KEY;
    expect(p.isAvailable()).toBe(false);
    if (orig !== undefined) process.env.GOOGLE_VISION_API_KEY = orig;
  });

  it('AzureProvider is unavailable without env vars', () => {
    const p = new AzureProvider();
    const origE = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    const origK = process.env.AZURE_DOC_INTELLIGENCE_KEY;
    delete process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    delete process.env.AZURE_DOC_INTELLIGENCE_KEY;
    expect(p.isAvailable()).toBe(false);
    if (origE !== undefined) process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT = origE;
    if (origK !== undefined) process.env.AZURE_DOC_INTELLIGENCE_KEY = origK;
  });

  it('TesseractProvider is always available', () => {
    expect(new TesseractProvider().isAvailable()).toBe(true);
  });

  it('selectOcrProvider returns an available provider', () => {
    const p = selectOcrProvider();
    expect(p.isAvailable()).toBe(true);
  });

  it('selectOcrProvider falls back to Tesseract when no cloud credentials', () => {
    const origGoogle = process.env.GOOGLE_VISION_API_KEY;
    const origAzureE = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    const origAzureK = process.env.AZURE_DOC_INTELLIGENCE_KEY;
    const origOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_VISION_API_KEY;
    delete process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    delete process.env.AZURE_DOC_INTELLIGENCE_KEY;
    delete process.env.OPENAI_API_KEY;

    const p = selectOcrProvider();
    expect(p.name).toBe('tesseract');

    if (origGoogle !== undefined) process.env.GOOGLE_VISION_API_KEY = origGoogle;
    if (origAzureE !== undefined) process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT = origAzureE;
    if (origAzureK !== undefined) process.env.AZURE_DOC_INTELLIGENCE_KEY = origAzureK;
    if (origOpenAI !== undefined) process.env.OPENAI_API_KEY = origOpenAI;
  });
});
