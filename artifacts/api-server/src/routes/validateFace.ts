/**
 * POST /api/validate/face
 * Checks that the uploaded image contains a clear human face (eyes, nose, ears).
 * Uses OpenAI Vision (gpt-4o) when available; falls open if the API is unavailable
 * so users are not hard-blocked by an API outage.
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

    // If OpenAI is unavailable, fail open so users aren't blocked by an outage
    if (!process.env.OPENAI_API_KEY) {
      res.json({ valid: true, reason: 'تم قبول الصورة' });
      return;
    }

    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
                text: `You are a profile-photo validator.
Analyse the image and decide whether it shows a single clear human face suitable for an official ID:
- Face must be clearly visible and well-lit
- Both eyes must be visible
- Nose and mouth visible
- Face must not be wearing sunglasses or a mask
- No group photos; exactly one person
Respond ONLY with valid compact JSON (no markdown, no extra text):
{"valid":true,"reason":"..."} or {"valid":false,"reason":"..."}
The reason must be in Arabic, one short sentence.`,
              },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        res.json({ valid: !!parsed.valid, reason: String(parsed.reason ?? '') });
      } else {
        req.log?.warn({ text }, 'Face validation: unexpected GPT response');
        res.json({ valid: false, reason: 'تعذّر تحليل الصورة، يرجى المحاولة مجدداً' });
      }
    } catch (err: any) {
      req.log?.error({ err }, 'Face validation error');
      // Fail open on transient API errors
      res.json({ valid: true, reason: 'تم قبول الصورة' });
    }
  },
);

export default router;
