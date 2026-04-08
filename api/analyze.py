# api/analyze.py
import json
from lexicalrichness import LexicalRichness
import textstat

def handler(request):
    try:
        # Vercel Python request body
        data = json.loads(request.get_data() or "{}")
        text = data.get("text", "")

        text = text.replace("’", "").replace("'", "")

        msttr_window = int(data.get("msttr_window", 50))
        mattr_window = int(data.get("mattr_window", 50))

        if not text:
            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Empty text"})
            }

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

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps(response)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
