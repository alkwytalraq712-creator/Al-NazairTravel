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
    // Must also clear the Replit AI integration pair, or OpenAIVisionProvider
    // stays available and selectOcrProvider never reaches Tesseract.
    const keys = [
      'GOOGLE_VISION_API_KEY',
      'AZURE_DOC_INTELLIGENCE_ENDPOINT',
      'AZURE_DOC_INTELLIGENCE_KEY',
      'OPENAI_API_KEY',
      'AI_INTEGRATIONS_OPENAI_BASE_URL',
      'AI_INTEGRATIONS_OPENAI_API_KEY',
    ];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    for (const k of keys) delete process.env[k];

    try {
      expect(selectOcrProvider().name).toBe('tesseract');
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
      }
    }
  });

  it('OpenAIVisionProvider is available via the Replit AI integration pair (no personal key)', () => {
    const keys = ['OPENAI_API_KEY', 'AI_INTEGRATIONS_OPENAI_BASE_URL', 'AI_INTEGRATIONS_OPENAI_API_KEY'];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    delete process.env.OPENAI_API_KEY;
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = 'https://proxy.example/v1';
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = 'dummy-signature';

    try {
      expect(new OpenAIVisionProvider().isAvailable()).toBe(true);
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
        else delete process.env[k];
      }
    }
  });

  it('OpenAIVisionProvider is available via a personal OPENAI_API_KEY alone', () => {
    const keys = ['OPENAI_API_KEY', 'AI_INTEGRATIONS_OPENAI_BASE_URL', 'AI_INTEGRATIONS_OPENAI_API_KEY'];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-personal-test';

    try {
      expect(new OpenAIVisionProvider().isAvailable()).toBe(true);
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
        else delete process.env[k];
      }
    }
  });

  it('OpenAIVisionProvider is unavailable with neither integration nor personal key', () => {
    const keys = ['OPENAI_API_KEY', 'AI_INTEGRATIONS_OPENAI_BASE_URL', 'AI_INTEGRATIONS_OPENAI_API_KEY'];
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    for (const k of keys) delete process.env[k];

    try {
      expect(new OpenAIVisionProvider().isAvailable()).toBe(false);
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
        else delete process.env[k];
      }
    }
  });
});
