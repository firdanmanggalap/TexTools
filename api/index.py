# --- Vercel serverless environment setup (read-only fs workaround) ---
# These two lines redirect HOME/NLTK_DATA to /tmp so libraries like nltk,
# textstat, and lexicalrichness can write their caches. The analyzer logic
# below is unchanged.
import os
os.environ.setdefault("HOME", "/tmp")
os.environ.setdefault("NLTK_DATA", "/tmp/nltk_data")
os.makedirs("/tmp/nltk_data", exist_ok=True)

import nltk  # noqa: E402
nltk.data.path.insert(0, "/tmp/nltk_data")
for _res in ("punkt", "punkt_tab"):
    try:
        nltk.data.find(f"tokenizers/{_res}")
    except LookupError:
        try:
            nltk.download(_res, download_dir="/tmp/nltk_data", quiet=True)
        except Exception:
            pass
# --- end env setup ---

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from lexicalrichness import LexicalRichness  # noqa: E402
import textstat  # noqa: E402
import re  # noqa: E402
import csv  # noqa: E402
import io  # noqa: E402
import statistics  # noqa: E402
from typing import Dict, List  # noqa: E402
from scipy import stats as scipy_stats  # noqa: E402

app = FastAPI()

# CORS (aman untuk dev, bisa dipersempit di production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        text = data.get("text", "")

        # 🔹 Clean text
        text = text.replace("’", "").replace("'", "").strip()

        if not text:
            return {"error": "Empty text"}

        # 🔹 Sentence detection (regex)
        sentences = re.split(r'[.!?\n\-]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = len(sentences)

        # 🔹 Lexical analysis
        lex = LexicalRichness(text)
        word_count = int(lex.words)

        # 🔹 Parameter
        msttr_window = int(data.get("msttr_window", 50))
        mattr_window = int(data.get("mattr_window", 50))
        hdd_draws = int(data.get("hdd_draws", 42))

        # 🔹 Safety adjustment
        msttr_w = min(msttr_window, word_count)
        mattr_w = min(mattr_window, word_count)
        hdd_d = min(hdd_draws, word_count)

        # 🔹 Avg sentence length
        avg_sentence_length = round(
            word_count / sentence_count, 2
        ) if sentence_count > 0 else 0

        # 🔹 MTLD safe call
        try:
            mtld_value = lex.mtld()
            mtld_value = round(float(mtld_value), 2) if mtld_value else 0
        except:
            mtld_value = 0

        response = {
            # Basic stats
            "words": word_count,
            "sentences": sentence_count,
            "avg_sentence_length": avg_sentence_length,

            # Lexical richness
            "types": int(lex.terms),
            "ttr": round(float(lex.ttr), 2),
            "rttr": round(float(lex.rttr), 2),
            "cttr": round(float(lex.cttr), 2),
            "mtld": mtld_value,
            "msttr": round(float(lex.msttr(segment_window=msttr_w)), 2),
            "mattr": round(float(lex.mattr(window_size=mattr_w)), 2),
            "hdd": round(float(lex.hdd(draws=hdd_d)), 2),

            # Readability
            "flesch_reading_ease": round(float(textstat.flesch_reading_ease(text)), 2),
            "flesch_kincaid_grade": round(float(textstat.flesch_kincaid_grade(text)), 2),
            "gunning_fog": round(float(textstat.gunning_fog(text)), 2),
            "smog_index": round(float(textstat.smog_index(text)), 2),
        }

        return response

    except Exception as e:
        return {"error": str(e)}


def _quantile(sorted_vals: List[float], q: float) -> float:
    """Linear-interp quantile (type 7 — matches numpy/R default)."""
    n = len(sorted_vals)
    if n == 0:
        return 0.0
    if n == 1:
        return float(sorted_vals[0])
    h = (n - 1) * q
    floor_h = int(h)
    if floor_h + 1 < n:
        return float(
            sorted_vals[floor_h]
            + (h - floor_h) * (sorted_vals[floor_h + 1] - sorted_vals[floor_h])
        )
    return float(sorted_vals[floor_h])


@app.post("/api/kruskal")
async def kruskal(request: Request):
    try:
        data = await request.json()
        csv_text = (data.get("csv_text") or "").strip()
        group_col = (data.get("group_col") or "level").strip()
        metric_cols = data.get("metric_cols") or []
        alpha = float(data.get("alpha", 0.05))

        if not csv_text:
            return {"error": "Empty CSV"}
        if not metric_cols:
            return {"error": "No metric columns selected"}

        reader = csv.DictReader(io.StringIO(csv_text))
        rows = list(reader)
        if not rows:
            return {"error": "CSV has no data rows"}

        headers = reader.fieldnames or []
        if group_col not in headers:
            return {"error": f"Group column '{group_col}' not found in CSV header"}

        # Bucket rows by group, preserving first-seen order
        groups_order: List[str] = []
        groups_rows: Dict[str, List[Dict[str, str]]] = {}
        for row in rows:
            g = (row.get(group_col) or "").strip()
            if not g:
                continue
            if g not in groups_rows:
                groups_rows[g] = []
                groups_order.append(g)
            groups_rows[g].append(row)

        if len(groups_order) < 2:
            return {
                "error": f"Need at least 2 groups in '{group_col}', found {len(groups_order)}"
            }

        results = []
        for metric in metric_cols:
            if metric not in headers:
                results.append(
                    {"metric": metric, "error": f"Column '{metric}' not in CSV"}
                )
                continue

            group_values: Dict[str, List[float]] = {}
            for gname in groups_order:
                vals: List[float] = []
                for r in groups_rows[gname]:
                    raw = (r.get(metric) or "").strip()
                    if not raw:
                        continue
                    # Tolerate both "." and "," decimals
                    try:
                        vals.append(float(raw.replace(",", ".")))
                    except ValueError:
                        continue
                if vals:
                    group_values[gname] = vals

            if len(group_values) < 2:
                results.append(
                    {
                        "metric": metric,
                        "error": f"Need numeric values in at least 2 groups for '{metric}'",
                    }
                )
                continue

            stat, p_value = scipy_stats.kruskal(*group_values.values())

            group_stats = {}
            for gname, vals in group_values.items():
                sorted_vals = sorted(vals)
                group_stats[gname] = {
                    "n": len(sorted_vals),
                    "median": float(statistics.median(sorted_vals)),
                    "mean": float(statistics.mean(sorted_vals)),
                    "q1": _quantile(sorted_vals, 0.25),
                    "q3": _quantile(sorted_vals, 0.75),
                    "min": float(sorted_vals[0]),
                    "max": float(sorted_vals[-1]),
                    "values": [float(v) for v in sorted_vals],
                }

            results.append(
                {
                    "metric": metric,
                    "h_stat": float(stat),
                    "p_value": float(p_value),
                    "df": len(group_values) - 1,
                    "alpha": alpha,
                    "significant": bool(p_value < alpha),
                    "groups": group_stats,
                }
            )

        return {
            "results": results,
            "group_order": groups_order,
            "alpha": alpha,
        }

    except Exception as e:
        return {"error": str(e)}
