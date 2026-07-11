import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
  FinalizeUploadBody,
  FinalizeUploadResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

import { requireAuth } from '../lib/auth';
import { ObjectPermission, setObjectAclPolicy } from '../lib/objectAcl';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Requires auth middleware so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * POST /storage/uploads/finalize
 *
 * Call after the file has been PUT to the presigned upload URL. Sets the
 * ACL policy on the freshly-uploaded object, marking the authenticated
 * caller as owner so it can later be retrieved via GET /storage/objects/*.
 */
router.post(
  '/storage/uploads/finalize',
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = FinalizeUploadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { objectPath, isPublic } = parsed.data;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await setObjectAclPolicy(objectFile, {
        owner: String(req.session.userId),
        visibility: isPublic ? 'public' : 'private',
      });
      // Must include the /api prefix — Replit's path-based routing only forwards
      // /api/* to this server. A bare /storage/* URL hits the web app instead
      // and returns HTML, so images silently fail to load.
      const publicUrl = isPublic
        ? `${req.protocol}://${req.get('host')}/api/storage${objectPath}`
        : undefined;
      res.json(FinalizeUploadResponse.parse({ objectPath, ...(publicUrl ? { publicUrl } : {}) }));
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: 'Object not found' });
        return;
      }
      req.log.error({ err: error }, 'Error finalizing upload');
      res.status(500).json({ error: 'Failed to finalize object' });
    }
  },
);

/**
 * Content types a browser will execute/render as active content on our origin.
 * Since users can upload arbitrary files (and some are public), serving these
 * inline would be a stored-XSS vector — so we neutralize them by forcing a
 * download and stripping the executable content-type. Images/PDF stay inline.
 */
const ACTIVE_CONTENT_TYPE_RE =
  /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|application\/(x-)?javascript|text\/javascript)/i;

function applySafeServingHeaders(res: Response): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const contentType = String(res.getHeader('Content-Type') ?? '');
  if (ACTIVE_CONTENT_TYPE_RE.test(contentType)) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');
  }
}

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      applySafeServingHeaders(res);

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * Public objects (visibility:'public') are served without authentication.
 * Private objects require the owner's session OR admin role.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    // Optional session — public objects work without auth
    const userId = req.session?.userId;

    // Admins can access all objects
    let isAdmin = false;
    if (userId) {
      try {
        const [u] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
        isAdmin = u?.role === 'admin';
      } catch { /* proceed with isAdmin=false */ }
    }

    if (!isAdmin) {
      // canAccessObjectEntity returns true for visibility:'public' even without userId
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId: userId ? String(userId) : undefined,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    applySafeServingHeaders(res);

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
