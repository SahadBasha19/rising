"""Create a reproducible demonstration model from generated weather observations.

Replace generate_dataset() with a validated local authority or weather dataset for
real-world use. This application is an educational decision-support prototype.
"""
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


def generate_dataset(samples=2500, seed=42):
    rng = np.random.default_rng(seed)
    rainfall = rng.gamma(shape=2.3, scale=55, size=samples).clip(0, 600)
    cloud_cover = rng.uniform(10, 100, samples)
    river_level = rng.uniform(1.0, 13.5, samples)
    humidity = rng.uniform(35, 100, samples)
    # A noisy flood-risk rule makes the example realistic enough for a demo.
    flood_score = (rainfall * 0.014 + cloud_cover * 0.012 + river_level * 0.48
                   + humidity * 0.009 + rng.normal(0, 0.55, samples))
    flood = (flood_score > 5.2).astype(int)
    return np.column_stack([rainfall, cloud_cover, river_level, humidity]), flood


def main():
    x, y = generate_dataset()
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(n_estimators=250, max_depth=10, random_state=42)
    model.fit(x_train, y_train)
    prediction = model.predict(x_test)
    print(f"Validation accuracy: {accuracy_score(y_test, prediction):.2%}")
    print(classification_report(y_test, prediction, target_names=["no flood", "flood"]))
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_DIR / "flood_risk_model.joblib")
    print("Saved models/flood_risk_model.joblib")


if __name__ == "__main__":
    main()
