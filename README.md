# TexTools

Lexical richness &amp; readability analyzer. Paste any English text and instantly
see word counts, vocabulary diversity (TTR / MTLD / MSTTR / MATTR / HD-D) and
readability scores (Flesch, Flesch-Kincaid, Gunning Fog, SMOG).

A single repo combining the **Next.js web app** and the **FastAPI analysis
backend**, deployable to Vercel as one project. Replaces the old split between
[`TexTools`](https://github.com/firdanmanggalap/TexTools) (Flutter build) and
[`TexTools-API`](https://github.com/firdanmanggalap/TexTools-API).

```
.
├── api/
│   ├── index.py          FastAPI app — function logic untouched from original
│   ├── requirements.txt
│   └── Dockerfile        (only for local docker-compose; Vercel doesn't use it)
├── src/                  Next.js app (app router)
│   ├── app/
│   ├── components/
│   └── lib/
├── public/
├── package.json
├── vercel.json           routes /api/* to api/index.py
└── docker-compose.yml    local dev option
```

## Deploy on Vercel

The repo is set up for a single-project deploy. Vercel detects:

- **Next.js** from `package.json` + `next.config.ts` at the root
- **Python serverless function** from `api/index.py` + `api/requirements.txt`

`vercel.json` rewrites all `/api/*` requests to the FastAPI handler, which
keeps the existing route `@app.post("/api/analyze")` working unchanged. Since
the web and the API live on the same origin, no CORS configuration is needed.

Just connect the repo on Vercel and deploy — no environment variables needed.

## Run locally

### Option A: Next dev + uvicorn

```bash
# Terminal 1 — API
cd api
pip install -r requirements.txt
uvicorn index:app --reload --port 8000

# Terminal 2 — Web
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Option B: docker-compose

```bash
docker compose up --build
```

## API contract

`POST /api/analyze`

```json
{
  "text": "Your input text",
  "msttr_window": 50,
  "mattr_window": 50,
  "hdd_draws": 42
}
```

See [`api/README.md`](./api/README.md) for the response shape.

## Credits

Original Flutter app &amp; Python API by
[@firdanmanggalap](https://github.com/firdanmanggalap). This monorepo rebuilds
the frontend in Next.js while keeping the API logic untouched.
