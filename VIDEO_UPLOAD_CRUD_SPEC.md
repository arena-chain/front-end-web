# Video Upload + Full CRUD (Backend Spec for Mobile/Web)

## Goal
From mobile and web, you want to:
1. Upload a video file
2. Save it on server disk under `uploads/` (like images)
3. Store the public link in DB (`Video.url`)
4. Manage full Video CRUD

## Current backend status (today)
- `Video` entity already exists (`title`, `description`, `url`, `thumbnailUrl`, `uploader`, `game`, `views`, `duration`).
- `VideoController` has JSON CRUD endpoints:
  - `POST /video`
  - `GET /video`
  - `GET /video/:id`
  - `PATCH /video/:id`
  - `DELETE /video/:id`
- Missing part: **multipart file upload endpoint** for video files.

---

## Backend changes needed

## 1) Add upload endpoint
Recommended new endpoint:

- `POST /video/upload`
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (video file: mp4/webm/mov)
  - `title` (string)
  - `description` (optional string)
  - `uploader` (user id)
  - `game` (optional game id)
  - `thumbnailUrl` (optional, or auto-generate later)
  - `duration` (optional number, or extracted server-side)

Use NestJS `@UseInterceptors(FileInterceptor('file', multerOptions))`.

Multer storage:
- Destination: `./uploads/videos`
- Filename: unique name (`Date.now() + random + ext`)

Validation:
- Max size (example 200MB)
- Allowed mimetypes: `video/mp4`, `video/webm`, `video/quicktime`

On success:
- Build URL like: `http://<host>:<port>/uploads/videos/<filename>`
- Save Video document with this URL in `Video.url`
- Return created video record

---

## 2) Serve static uploaded files
In Nest app bootstrap/module, ensure static serving for uploads:

- Mount `/uploads` -> local folder `uploads`

Then stored URL in DB should be directly accessible from mobile/web:
- `https://api.domain.com/uploads/videos/<filename>`

---

## 3) Keep normal CRUD (full management)
After upload support, keep existing CRUD:

- `POST /video` (manual create from external URL)
- `GET /video` (list)
- `GET /video/:id` (detail)
- `PATCH /video/:id` (edit metadata)
- `DELETE /video/:id` (delete record)

Recommended delete behavior:
- When deleting a DB record for local uploaded video, also remove file from disk if path belongs to `/uploads/videos/`.

---

## API contract suggestion

### Upload response (example)
```json
{
  "_id": "66abc123...",
  "title": "Clutch Ace vs Team X",
  "description": "Quarterfinal round",
  "url": "http://localhost:3000/uploads/videos/1719999999-abc123.mp4",
  "thumbnailUrl": "",
  "uploader": "6655...",
  "game": "6644...",
  "views": 0,
  "duration": 75,
  "createdAt": "2026-03-30T10:00:00.000Z",
  "updatedAt": "2026-03-30T10:00:00.000Z"
}
```

---

## Mobile/Web usage

## Mobile (Flutter/Dart) upload flow
1. Pick video from gallery/camera
2. Build `MultipartRequest` to `POST /video/upload`
3. Send text fields + file
4. Read response JSON
5. Save returned `url` in UI state (or DB already saved by backend)

## Web upload flow
1. `<input type="file" accept="video/*">`
2. Build `FormData`
3. `fetch('/video/upload', { method: 'POST', body: formData })`
4. Use returned `video.url` for playback

---

## cURL test
```bash
curl -X POST "http://localhost:3000/api/video/upload" \
  -F "file=@/absolute/path/highlight.mp4" \
  -F "title=Scrim Highlights" \
  -F "description=Best rounds" \
  -F "uploader=6655aa11bb22cc33dd44ee55" \
  -F "game=6644aa11bb22cc33dd44ee66"
```

---

## Security and performance recommendations
- Require JWT auth on upload (`@UseGuards(AuthGuard('jwt'))`)
- Optional role restriction (`player`, `team_manager`, `admin`, etc.)
- Add rate-limit for upload endpoint
- Validate extension + mimetype both
- Consider background transcoding/compression for big files
- Consider object storage (S3/Cloudflare R2) later if local disk becomes a bottleneck

---

## Minimal rollout checklist
- [ ] Add `POST /video/upload` with multer interceptor
- [ ] Save files to `uploads/videos`
- [ ] Expose `/uploads` statically
- [ ] Save generated URL into `Video.url`
- [ ] Keep existing CRUD endpoints
- [ ] Optionally delete physical file on `DELETE /video/:id`
- [ ] Test from Postman + mobile + web

