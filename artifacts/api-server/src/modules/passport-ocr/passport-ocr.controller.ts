/**
 * Passport OCR controller — Express route handler.
 *
 * POST /api/ocr/passport
 *   - multipart/form-data, field: passportImage (JPEG/PNG ≤ 10 MB)
 *   - Requires auth (Bearer JWT or session)
 *   - Rate-limited to 10 req/min per user
 *   - Returns structured passport JSON
 */

import { Router, type IRouter, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../lib/auth.js';
import { getAvailableProviders } from './ocr.provider.js';
import { PassportOcrService } from './passport-ocr.service.js';
import { validateImageBuffer, MAX_FILE_SIZE_BYTES } from './image.service.js';
import { ObjectStorageService } from '../../lib/objectStorage.js';
import { setObjectAclPolicy } from '../../lib/objectAcl.js';

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

// ─── Multer: memory storage, 10 MB limit ──────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    const ok = /^image\/(jpeg|jpg|png)$/i.test(file.mimetype);
    if (ok) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Unsupported image type'), { code: 'UNSUPPORTED_TYPE' }));
    }
  },
});

// ─── Per-user rate limiter: 10 req/min ────────────────────────────────────────

const ocrRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  // Key by userId when authenticated; never fall back to req.ip to avoid IPv6 bypass
  keyGenerator: (req) => String((req as any).session?.userId ?? 'anon'),
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OCR requests. Limit: 10 per minute.' },
  handler(_req, res, _next, options) {
    res.status(429).json(options.message);
  },
});

// ─── Helper: store passport image in object storage ───────────────────────────

async function storePassportImage(
  buffer: Buffer,
  userId: number,
  mimetype: string,
): Promise<string> {
  const uploadUrl = await objectStorage.getObjectEntityUploadURL();
  const objectPath = objectStorage.normalizeObjectEntityPath(uploadUrl);

  // Upload directly to GCS via presigned URL
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimetype },
    body: buffer,
  });

  // Finalize: set ACL so owner can read it
  const objectFile = await objectStorage.getObjectEntityFile(objectPath);
  await setObjectAclPolicy(objectFile, {
    owner: String(userId),
    visibility: 'private',
  });

  return objectPath;
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/ocr/passport
 * Accept: multipart/form-data; field "passportImage"
 */
router.post(
  '/ocr/passport',
  requireAuth,
  ocrRateLimit,
  (req: Request, res: Response, next) => {
    upload.single('passportImage')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File too large. Maximum size is 10 MB.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      if (err) {
        if ((err as any).code === 'UNSUPPORTED_TYPE') {
          res.status(415).json({ error: 'Unsupported image type. Accepted: JPEG, PNG.' });
          return;
        }
        next(err);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'passportImage field is required.' });
      return;
    }

    // Extra validation (size + magic bytes)
    const validationError = validateImageBuffer(file.buffer, file.mimetype);
    if (validationError) {
      res.status(validationError.includes('large') ? 413 : 415).json({ error: validationError });
      return;
    }

    const userId = (req as any).session?.userId as number;
    const providers = getAvailableProviders(); // all providers in priority order
    const start = Date.now();

    // Try each provider in sequence — fall back on transient errors (rate-limit, quota, network)
    let result: Awaited<ReturnType<PassportOcrService['process']>> | null = null;
    let lastErr: unknown = null;

    for (const provider of providers) {
      req.log?.info({
        event: 'ocr.start',
        provider: provider.name,
        imageSize: file.buffer.length,
        userId,
      });

      try {
        const service = new PassportOcrService(provider);
        result = await service.process(file.buffer);
        break; // success — stop trying further providers
      } catch (err: any) {
        lastErr = err;
        const isTransient =
          err?.status === 429 || // rate limit / quota
          err?.status === 503 || // service unavailable
          err?.code === 'insufficient_quota' ||
          err?.code === 'ECONNRESET';

        req.log?.warn({
          event: 'ocr.provider_failed',
          provider: provider.name,
          error: err?.message,
          isTransient,
        });

        if (err.code === 'PASSPORT_INVALID') {
          // Not a transient error — don't bother trying other providers
          res.status(422).json({
            error: 'Passport not detected or data invalid.',
            details: err.details ?? [],
          });
          return;
        }

        if (!isTransient) break; // non-retriable — stop trying
        // Otherwise: continue to next provider in the chain
      }
    }

    if (!result) {
      const durationMs = Date.now() - start;
      req.log?.error({ err: lastErr, event: 'ocr.all_providers_failed', durationMs });
      res.status(500).json({ error: 'OCR processing failed. Please try again.' });
      return;
    }

    // Store passport image asynchronously (don't block response)
    let passportImagePath: string | null = null;
    try {
      passportImagePath = await storePassportImage(file.buffer, userId, file.mimetype);
    } catch (storageErr) {
      req.log?.warn({ err: storageErr }, 'Passport image storage failed (non-fatal)');
    }

    const durationMs = Date.now() - start;
    req.log?.info({
      event: 'ocr.complete',
      provider: result.provider,
      confidence: result.passport.confidence,
      mrzDetected: !!result.passport.mrz,
      durationMs,
    });

    res.json({
      success: true,
      passport: result.passport,
      meta: {
        provider: result.provider,
        durationMs,
        passportImagePath,
      },
    });
  },
);

export default router;
