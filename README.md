# Video Tracker

A simple internal tool for tracking client videos: a grid of cards, each with a thumbnail,
a Google Drive link, and a paid/unpaid status. Any change (add, edit, delete, mark as paid)
requires a shared passkey.

Stack: React + Vite + Tailwind CSS (frontend), Node.js + Express (backend), MongoDB (database).

## 1. First-time setup

Requires [Node.js](https://nodejs.org) (v18+) and [MongoDB](https://www.mongodb.com/try/download/community)
installed and running locally.

```bash
npm run install:all
```

Then open `server/.env` and set your own values:

- `PASSKEY` — the shared password required to add/edit/delete videos or mark them paid.
- `MONGODB_URI` — already defaults to a local MongoDB database, no change needed if you're
  running MongoDB locally.

## 2. Running it day-to-day

From the project root:

```bash
npm run dev
```

This starts the backend on `http://localhost:5001` and the frontend on `http://localhost:5173`.
Open the frontend URL in your browser — that's the app.

Alternatively, for a single-process setup (one URL, no separate dev server), build the
frontend once and let the backend serve it:

```bash
npm start
```

Then visit `http://localhost:5001`.

## How it works

- Viewing the grid and opening Drive links is open to anyone with the URL.
- Click **Unlock to edit** and enter the passkey to add, edit, delete, or mark a video as paid.
  Once unlocked, you stay unlocked for that browser tab for 12 hours (or until you click **Lock**).
- To add a video: click **+ Add video**, then either paste a copied image directly into the
  thumbnail box (click it, then Ctrl/Cmd+V) or click it to choose a file, then set the video
  number and Drive link. Thumbnails are shown at a 9:16 (portrait) ratio.
- The video number is shown as a badge on each thumbnail and the grid is sorted by it
  (highest first). A new card's number is pre-filled with the next one in sequence, but you
  can change it.
- Cards with a green border and "Paid" badge are marked as paid; grey border means unpaid.

## Project structure

```
server/   Express API + MongoDB models, image uploads stored in server/uploads
client/   React frontend (Vite + Tailwind)
```

## Notes

- Thumbnails are stored as files on disk in `server/uploads`, referenced from MongoDB. This
  keeps things simple for running on a single local machine. If you later move this to a
  cloud host with an ephemeral filesystem (e.g. many free-tier PaaS platforms wipe local files
  on redeploy), swap the image storage for a service like Cloudinary or S3 instead.
- Keep `server/.env` private — it holds your passkey and session secret. It's already excluded
  from git via `.gitignore`.
