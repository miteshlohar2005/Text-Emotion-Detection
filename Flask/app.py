import logging

from flask import Flask, render_template, request
from predict import Emotion_Detector
import warnings

warnings.filterwarnings("ignore")

logger = logging.getLogger(__name__)

obj = Emotion_Detector()

app = Flask(__name__)

def render_prediction_form(text="", error=None, result=None):
    return render_template(
        "index.html",
        text=text,
        error=error,
        result=result,
    )


@app.route("/", methods=["GET", "POST"])
@app.route("/predict", methods=["GET", "POST"])
def predict():
    if request.method == "GET":
        return render_prediction_form()

    text = request.form.get("textfield", "").strip()
    if not text:
        return render_prediction_form(
            error="Please enter some text before predicting an emotion."
        )

    try:
        label, scores = obj.predict(text)
        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        confidence = next(
            (score for emotion, score in scores.items() if emotion.startswith(label)),
            None,
        )
        result = {
            "label": label,
            "confidence": confidence,
            "scores": [
                {"emotion": emotion, "score": round(score, 2)}
                for emotion, score in sorted_scores
            ],
        }
        return render_prediction_form(text=text, result=result)
    except (LookupError, OSError, ValueError, RuntimeError):
        logger.exception("Emotion prediction failed")
        return render_prediction_form(
            text=text,
            error="The text could not be analyzed right now. Please try again.",
        )

if __name__ == '__main__':
    app.run(debug = True)