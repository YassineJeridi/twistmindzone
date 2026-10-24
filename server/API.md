# Twist Mind Zone API (v1)

Server-to-server API for reading and editing Twist Mind Zone **videos** and **PDFs** from
other Redix apps (e.g. the REDIX dashboard). Code: `src/routes/api.js`.

## Base URL

| From | Base URL |
|---|---|
| Same VPS (preferred) | `http://127.0.0.1:5006/api/v1` |
| Anywhere else | `https://twistmindzone.redixdigitalsolutions.com/api/v1` |

## Authentication

Every request needs the key from `API_KEY` in `server/.env`:

```
X-API-Key: <API_KEY>
```

Missing or wrong key returns `401`. If `API_KEY` is unset, all routes return `503`.
Keep the key server-side only: never ship it to a browser. To rotate it, change the value in
`.env`, run `pm2 restart twistmindzone-server`, then update the calling app.

## Endpoints

| Method | Path | Does |
|---|---|---|
| `GET` | `/summary` | Paid/unpaid counts for videos and PDFs |
| `GET` | `/videos` | List videos (paginated, filterable) |
| `GET` | `/videos/:id` | Get one video |
| `POST` | `/videos` | Create a video (multipart, thumbnail required) |
| `PATCH` | `/videos/:id` | Update fields and/or replace the thumbnail |
| `DELETE` | `/videos/:id` | Delete a video and its thumbnail file |
| `GET` | `/pdfs` | List PDFs (paginated, filterable) |
| `GET` | `/pdfs/:id` | Get one PDF |
| `POST` | `/pdfs` | Create a PDF (multipart, image required) |
| `PATCH` | `/pdfs/:id` | Update fields and/or replace the image |
| `DELETE` | `/pdfs/:id` | Delete a PDF and its image file |

### `GET /summary`

```json
{
  "videos": { "total": 31, "paid": 24, "unpaid": 7 },
  "pdfs":   { "total": 3,  "paid": 0,  "unpaid": 3 }
}
```

### `GET /videos` and `GET /pdfs`

Query parameters (all optional):

| Param | Meaning |
|---|---|
| `page` | Page number, default `1` |
| `limit` | Page size, default `50`, max `500`, or `all` for every record in one response |
| `paid` | `true` or `false` |
| `updatedSince` | Only records changed after this time, for incremental sync |
| `sort` | Videos: `number` (default, highest video number first), `newest`, `oldest`, `updated`.<br>PDFs: `newest` (default), `oldest`, `updated`, `name` |

Response:

```json
{
  "data": [ { … } ],
  "total": 31,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Objects

Video:

```json
{
  "_id": "6a…",
  "videoNumber": 31,
  "driveLink": "https://drive.google.com/…",
  "thumbnailUrl": "/uploads/1790489665654-2ccadbf66723.png",
  "thumbnailAbsoluteUrl": "https://twistmindzone.redixdigitalsolutions.com/uploads/1790489665654-2ccadbf66723.png",
  "paid": true,
  "createdAt": "…",
  "updatedAt": "…"
}
```

PDF:

```json
{
  "_id": "6a…",
  "name": "…",
  "puzzleCount": 12,
  "imageUrl": "/uploads/1789597411370-3b16652ef1cf.png",
  "imageAbsoluteUrl": "https://twistmindzone.redixdigitalsolutions.com/uploads/1789597411370-3b16652ef1cf.png",
  "paid": false,
  "createdAt": "…",
  "updatedAt": "…"
}
```

### Editable fields

| Resource | Fields | Image form field |
|---|---|---|
| Videos | `videoNumber` (number), `driveLink` (string), `paid` (boolean) | `thumbnail` |
| PDFs | `name` (string), `puzzleCount` (number), `paid` (boolean) | `image` |

- Numbers and booleans can be sent as strings (`"12"`, `"true"`), as multipart forms require.
- `null` or `""` clears a string field; clearing a required field is rejected.
- `_id`, the image URLs, `createdAt` and `updatedAt` are read-only and ignored if sent, so a
  fetched object can be edited and sent back as-is.
- Any other field name is rejected with `400`, listing the editable fields.
- Images: jpg/png/webp/etc., max 10 MB.

### Create

`multipart/form-data`. The image is required, as the model requires it. Returns `201` with the
created object.

```bash
curl "$BASE/videos" -H "X-API-Key: $KEY" \
  -F videoNumber=32 -F driveLink="https://drive.google.com/…" -F thumbnail=@thumb.png

curl "$BASE/pdfs" -H "X-API-Key: $KEY" \
  -F name="Puzzle pack 4" -F puzzleCount=20 -F image=@cover.png
```

### Update

Send only what changes. JSON for fields only; multipart to also replace the image (the old
image file is deleted). Returns the updated object.

```bash
# mark a video as paid
curl -X PATCH "$BASE/videos/$ID" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"paid": true}'

# replace a PDF's image and rename it
curl -X PATCH "$BASE/pdfs/$ID" -H "X-API-Key: $KEY" \
  -F name="Puzzle pack 4 (v2)" -F image=@new-cover.png
```

### Delete

```bash
curl -X DELETE "$BASE/videos/$ID" -H "X-API-Key: $KEY"
# -> { "ok": true, "id": "…" }
```

## Errors

Errors are JSON: `{ "message": "…", "details": { … } }`.

| Status | When |
|---|---|
| `400` | Bad input. Validation failures put a per-field message in `details`. |
| `401` | Missing or wrong API key |
| `404` | Video, PDF or route not found |
| `503` | `API_KEY` not configured |

## Example (Node, axios)

```js
const twist = axios.create({
  baseURL: 'http://127.0.0.1:5006/api/v1',
  headers: { 'X-API-Key': process.env.TWISTMINDZONE_API_KEY },
});

const { data: summary } = await twist.get('/summary');
const { data: unpaid } = await twist.get('/videos', { params: { paid: false, limit: 'all' } });
await twist.patch(`/videos/${id}`, { paid: true });
```
