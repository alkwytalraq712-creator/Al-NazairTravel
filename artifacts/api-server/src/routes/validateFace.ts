/**
 * POST /api/validate/face
 * Verifies that the uploaded image contains a single clear human face.
 * Uses the Replit-managed OpenAI Vision integration (no personal quota limits).
 *
 * IMPORTANT: this endpoint FAILS CLOSED. If the image is not a valid face, or
 * the AI cannot verify it, we return { valid:false } — we never wave images
 * through. A non-face (e.g. a photo of text) must never be accepted.
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../lib/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    cb(null, /^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.mimetype));
  },
});

function getOpenAIConfig(): { baseURL?: string; apiKey: string } | null {
  const integrationBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const integrationKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  // Only use integration if BASE_URL is actually a valid URL (not accidentally set to a key).
  if (integrationBase && integrationKey && integrationBase.startsWith('http')) {
    return { baseURL: integrationBase, apiKey: integrationKey };
  }
  if (process.env.OPENAI_API_KEY) {
    return { apiKey: process.env.OPENAI_API_KEY };
  }
  return null;
}

router.post(
  '/validate/face',
  requireAuth,
  (req: Request, res: Response, next) => {
    upload.single('faceImage')(req, res, (err) => {
      if (err) {
        res.status(400).json({ valid: false, reason: 'تعذّر رفع الصورة' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ valid: false, reason: 'الصورة مطلوبة' });
      return;
    }

    const config = getOpenAIConfig();
    if (!config) {
      // No AI available — fail closed rather than fake a pass.
      res.json({ valid: false, reason: 'خدمة التحقق غير متاحة حالياً، يرجى المحاولة لاحقاً' });
      return;
    }

    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI(config);

      const b64 = req.file.buffer.toString('base64');
      const mime = req.file.mimetype.includes('heic') ? 'image/jpeg' : req.file.mimetype;

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_completion_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mime};base64,${b64}`, detail: 'low' },
              },
              {
                type: 'text',
                text: `You are a strict profile-photo validator for an official government ID.
Look at the image and decide whether it shows a SINGLE, REAL, LIVE human face suitable for an ID photo.
Reject the image (valid:false) if ANY of these are true:
- No human face is present (e.g. it's a document, text, passport, screenshot, object, animal, or landscape)
- More than one person
- Eyes, nose, or mouth are not clearly visible
- Wearing sunglasses or a face mask
- Too dark, too blurry, or heavily obscured
- It's a photo of another photo/screen, a drawing, or an illustration
Accept (valid:true) ONLY when a single clear real human face fills a reasonable portion of the frame.
Respond ONLY with compact JSON, no markdown:
{"valid":true,"reason":"..."} or {"valid":false,"reason":"..."}
The reason must be a short sentence in Arabic.`,
              },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        // Strict fail-closed: only a real boolean `true` accepts. Strings like
        // "false"/"no" or numbers must NOT wave the image through.
        const isValid = parsed.valid === true;
        res.json({
          valid: isValid,
          reason: String(parsed.reason ?? (isValid ? 'تم التحقق من الوجه' : 'لم يتم التعرف على وجه واضح')),
        });
      } else {
        req.log?.warn({ text }, 'Face validation: unexpected model response');
        res.json({ valid: false, reason: 'تعذّر تحليل الصورة، يرجى التقاط صورة أوضح للوجه' });
      }
    } catch (err: any) {
      req.log?.error({ err }, 'Face validation error');
      // FAIL CLOSED — do not accept unverified images. Let the user retry.
      res.json({ valid: false, reason: 'تعذّر التحقق من الصورة، يرجى المحاولة مرة أخرى' });
    }
  },
);

export default router;
