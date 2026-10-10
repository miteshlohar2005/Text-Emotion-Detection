import logging

from flask import Flask, jsonify, render_template, request
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

    # Support JSON payload or Form data
    if request.is_json:
        data = request.get_json(silent=True) or {}
        text = str(data.get("textfield", "")).strip()
    else:
        text = str(request.form.get("textfield", "")).strip()

    is_ajax = bool(
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )

    if not text:
        err_msg = "Please enter some text before predicting an emotion."
        if is_ajax:
            return jsonify({"status": "error", "error": err_msg}), 400
        return render_prediction_form(error=err_msg)

    try:
        label, scores = obj.predict(text)
        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        confidence = next(
            (score for emotion, score in scores.items() if emotion.startswith(label)),
            None,
        )

        # Format scores without emojis to strictly adhere to the monochrome design system
        formatted_scores = []
        for emotion_key, score in sorted_scores:
            clean_name = emotion_key.split()[0].capitalize()
            formatted_scores.append({
                "emotion": clean_name,
                "raw_emotion": clean_name.lower(),
                "score": round(score, 2),
            })

        clean_label = label.split()[0].capitalize()
        confidence_val = round(confidence, 2) if confidence is not None else None

        result = {
            "label": clean_label,
            "raw_label": clean_label.lower(),
            "confidence": confidence_val,
            "scores": formatted_scores,
        }

        if is_ajax:
            return jsonify({
                "status": "success",
                "text": text,
                "result": result,
            })

        return render_prediction_form(text=text, result=result)
    except (LookupError, OSError, ValueError, RuntimeError):
        logger.exception("Emotion prediction failed")
        err_msg = "The text could not be analyzed right now. Please try again."
        if is_ajax:
            return jsonify({"status": "error", "error": err_msg}), 500
        return render_prediction_form(
            text=text,
            error=err_msg,
        )

if __name__ == '__main__':
    app.run(debug = True)