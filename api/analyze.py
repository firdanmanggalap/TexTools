from fastapi import FastAPI, Request
from mangum import Mangum
from lexicalrichness import LexicalRichness
import textstat
import json

app = FastAPI()

@app.post("/api/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        text = data.get("text", "")
        text = text.replace("’", "").replace("'", "")

        msttr_window = int(data.get("msttr_window", 50))
        mattr_window = int(data.get("mattr_window", 50))

        if not text:
            return {"error": "Empty text"}

        lex = LexicalRichness(text)
        response = {
            "words": lex.words,
            "types": lex.terms,
            "ttr": lex.ttr,
            "rttr": lex.rttr(),
            "cttr": lex.cttr(),
            "mtld": lex.mtld(),
            "msttr": lex.msttr(segment_window=msttr_window),
            "mattr": lex.mattr(window_size=mattr_window),
            "hdd": lex.hdd(draws=42),
            "flesch_reading_ease": textstat.flesch_reading_ease(text),
            "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
            "gunning_fog": textstat.gunning_fog(text),
            "smog_index": textstat.smog_index(text),
        }
        return response

    except Exception as e:
        return {"error": str(e)}

# Adapter buat serverless (Vercel)
handler = Mangum(app)