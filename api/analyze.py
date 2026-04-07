from flask import Flask, request, jsonify
import textstat
from lexicalrichness import LexicalRichness
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.json
        text = data.get("text", "")
        text = text.replace("’", "").replace("'", "")

        try:
            msttr_window = int(data.get("msttr_window", 50))
        except (TypeError, ValueError):
            msttr_window = 50
            
        try:
            mattr_window = int(data.get("mattr_window", 50))
        except (TypeError, ValueError):
            mattr_window = 50

        lex = LexicalRichness(text)
        lexical_data = {
            "words": lex.words,
            "types": lex.terms,
            "ttr": lex.ttr,
            "rttr": lex.rttr,
            "cttr": lex.cttr,
            "mtld": lex.mtld(),
            "msttr": lex.msttr(segment_window=msttr_window),
            "mattr": lex.mattr(window_size=mattr_window),
            "hdd": lex.hdd(draws=42),
        }

        textstat_data = {
            "flesch_reading_ease": textstat.flesch_reading_ease(text),
            "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
            "gunning_fog": textstat.gunning_fog(text),
            "smog_index": textstat.smog_index(text),
        }

        # Combine both dictionaries so Flutter can access keys directly at the root level
        return jsonify({**lexical_data, **textstat_data})

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(port=5000, debug=True)