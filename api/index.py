from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from lexicalrichness import LexicalRichness
import textstat
import re

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
