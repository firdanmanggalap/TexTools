# TexTools

Lexical richness &amp; readability analyzer. Paste any English text and instantly
see word counts, vocabulary diversity (TTR / MTLD / MSTTR / MATTR / HD-D) and
readability scores (Flesch, Flesch-Kincaid, Gunning Fog, SMOG).

This is a monorepo combining the **web frontend** (formerly the standalone
[`TexTools`](https://github.com/firdanmanggalap/TexTools) repo, originally
built in Flutter) and the **analysis API** (formerly
[`TexTools-API`](https://github.com/firdanmanggalap/TexTools-API)) into a
single project.

```
textools/
├── web/          Next.js 16 + React 19 + Tailwind v4 frontend
├── api/          FastAPI service (Python)
└── docker-compose.yml
```

## Quick start

### 1. Run the API

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

### 2. Run the web app

```bash
cd web
cp .env.example .env.local
# Edit .env.local if you want to point at a different API (defaults to the
# Railway deployment so you can run the UI with zero backend setup).
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Or run both with Docker

```bash
docker compose up --build
```

## Configuration

The web app reads `NEXT_PUBLIC_API_URL` at build time. If unset, it falls back
to the public Railway deployment of the API, so the UI works out of the box.

## API

`POST /api/analyze`

```json
{
  "text": "Your input text",
  "msttr_window": 50,
  "mattr_window": 50,
  "hdd_draws": 42
}
```

See [`api/README.md`](./api/README.md) for the full response shape.

## Credits

Original Flutter app &amp; Python API by [@firdanmanggalap](https://github.com/firdanmanggalap).
This monorepo rebuilds the frontend in Next.js while keeping the API logic
untouched.
