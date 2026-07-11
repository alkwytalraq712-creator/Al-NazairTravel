---
name: Object storage ACL finalize pattern
description: How uploaded objects get their ACL set; why a /finalize endpoint is needed.
---

After a client PUTs a file to the presigned GCS URL, the object exists in GCS but has no ACL metadata (`custom:aclPolicy`). `canAccessObjectEntity` returns false for any user (including the uploader) if no policy is set — the object is effectively inaccessible. The fix is a separate `POST /api/storage/uploads/finalize` endpoint that the client calls after the PUT succeeds. It calls `setObjectAclPolicy(objectFile, { owner: String(userId), visibility: 'private' })` so the owner can later retrieve their file via `GET /api/storage/objects/*`.

**Why:** `setObjectAclPolicy` internally calls `objectFile.exists()` and throws if the file doesn't exist yet, so ACL cannot be set before the PUT upload completes. A finalize step is the only clean approach.

**How to apply:** Every upload flow (passport photos, personal photos, visa documents) must call `/finalize` after the PUT. Store the returned `objectPath` in the database. To serve: `GET /api/storage${objectPath}` with a Bearer token.
