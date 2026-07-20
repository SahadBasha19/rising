"""Rising Waters: a simple flood-risk prediction web application."""
from pathlib import Path
from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from train_model import generate_dataset

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "flood_risk_model.joblib"

app = Flask(__name__)

def get_model():
    if not MODEL_PATH.exists():
        MODEL_PATH.parent.mkdir(exist_ok=True, parents=True)
        x, y = generate_dataset()
        model = RandomForestClassifier(n_estimators=250, max_depth=10, random_state=42)
        model.fit(x, y)
        joblib.dump(model, MODEL_PATH)
    return joblib.load(MODEL_PATH)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json() or {}
        rainfall = float(data.get("rainfall", 0))
        cloud_cover = float(data.get("cloud_cover", 0))
        river_level = float(data.get("river_level", 0))
        humidity = float(data.get("humidity", 0))

        if not (0 <= rainfall <= 600 and 0 <= cloud_cover <= 100
                and 0 <= river_level <= 15 and 0 <= humidity <= 100):
            return jsonify({"error": "Inputs exceed realistic boundary limits"}), 400

        features = np.array([[rainfall, cloud_cover, river_level, humidity]])
        model = get_model()
        probability = float(model.predict_proba(features)[0, 1]) * 100
        risk = "High" if probability >= 70 else "Moderate" if probability >= 35 else "Low"
        
        recommendations = {
            "High": "Activate local response procedures and follow guidance from emergency authorities immediately.",
            "Moderate": "Increase monitoring frequency and prepare local evacuation resources.",
            "Low": "Maintain routine monitoring and review official daily weather reports."
        }
        
        return jsonify({
            "probability": round(probability, 1),
            "risk": risk,
            "recommendation": recommendations[risk]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/train", methods=["POST"])
def train():
    try:
        x, y = generate_dataset()
        x_train, x_test, y_train, y_test = train_test_split(
            x, y, test_size=0.2, random_state=42, stratify=y
        )
        model = RandomForestClassifier(n_estimators=250, max_depth=10, random_state=42)
        model.fit(x_train, y_train)
        prediction = model.predict(x_test)
        
        acc = accuracy_score(y_test, prediction)
        report = classification_report(y_test, prediction, target_names=["no flood", "flood"], output_dict=True)
        
        MODEL_PATH.parent.mkdir(exist_ok=True, parents=True)
        joblib.dump(model, MODEL_PATH)
        
        return jsonify({
            "success": True,
            "accuracy": round(acc * 100, 2),
            "precision_flood": round(report["flood"]["precision"] * 100, 2),
            "recall_flood": round(report["flood"]["recall"] * 100, 2),
            "f1_flood": round(report["flood"]["f1-score"] * 100, 2),
            "samples": len(x)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
