# TexTools API

FastAPI service that powers the TexTools analyzer. Computes lexical richness
(via [`lexicalrichness`](https://pypi.org/project/lexicalrichness/)) and
readability metrics (via [`textstat`](https://pypi.org/project/textstat/)).

> The implementation in `index.py` is intentionally untouched from the
> original — only the filename was changed (from `main.py`) to match Vercel's
> Python serverless function convention.

## Run locally

```bash
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```

## Run with Docker

```bash
docker build -t textools-api .
docker run -p 8000:8000 textools-api
```

## Endpoint

`POST /api/analyze`

```json
{
  "text": "Your text here...",
  "msttr_window": 50,
  "mattr_window": 50,
  "hdd_draws": 42
}
```

Returns word/sentence counts, lexical richness metrics (TTR, RTTR, CTTR, MTLD,
MSTTR, MATTR, HD-D) and readability scores (Flesch Reading Ease, Flesch-Kincaid
Grade, Gunning Fog, SMOG).
