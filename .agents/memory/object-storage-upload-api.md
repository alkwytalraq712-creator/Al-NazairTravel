---
name: Object storage upload API fields
description: Correct field names for the upload request/response — differs from what older mobile code assumed.
---

## UploadUrlRequest (POST /storage/uploads/request-url)
- `name: string` — file name (NOT `fileName`, NOT `folder`)
- `size: number` — file size in bytes (required — must fetch blob first)
- `contentType: string` — MIME type

## UploadUrlResponse
- `uploadURL: string` — presigned GCS PUT URL (uppercase URL, NOT `uploadUrl`)
- `objectPath: string` — normalized path like `/objects/uploads/{uuid}`

## FinalizeUploadRequest (POST /storage/uploads/finalize)
- `objectPath: string`
- `isPublic?: boolean` — when true, sets ACL to `visibility: 'public'` and returns `publicUrl`

## FinalizeUploadResponse
- `objectPath: string`
- `publicUrl?: string` — full server URL like `{protocol}://{host}/storage{objectPath}` (only when isPublic=true)

## Upload flow (correct)
```js
const body = await fetch(asset.uri).then(r => r.blob());
const { uploadURL, objectPath } = await requestUrl.mutate({ data: { name, size: body.size, contentType } });
await fetch(uploadURL, { method: 'PUT', body, headers: { 'Content-Type': contentType } });
const { publicUrl } = await finalize.mutate({ data: { objectPath, isPublic: true } });
const url = publicUrl ?? objectPath;
```

**Why:** Older mobile code used wrong field names (`fileName`, `folder`, `uploadUrl`) that silently returned undefined because Promise<any> was used. The actual API uses `name`/`size`/`uploadURL`. Always cross-check against UploadUrlRequest interface in generated api.schemas.ts.
