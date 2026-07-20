# Rising Waters

Rising Waters is an educational machine-learning prototype that estimates flood risk from weather and river observations. A Flask dashboard accepts rainfall, cloud cover, river level, and humidity and returns a low, moderate, or high risk indication.

> **Important:** This is not an operational early-warning system. Its bundled model is trained on generated demonstration data. Before using output for public safety decisions, replace it with validated local data, test for bias and failure modes, and obtain domain-expert approval.

## Features

- Random Forest classification model with repeatable training
- Responsive Flask web interface
- Flood-risk probability and plain-language recommendation
- Input validation and clear safety guidance

## Quick start

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python train_model.py
python app.py
```

Open `http://127.0.0.1:5000` in a browser.

## GitHub publishing

After creating an empty GitHub repository, run:

```bash
git add .
git commit -m "Create Rising Waters flood-risk predictor"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/rising-waters.git
git push -u origin main
```

## GitHub Pages deployment

This project includes a static site entrypoint at `index.html` and a `docs/` copy for GitHub Pages.

- If your Pages source is set to the repository root, GitHub will serve `index.html` and the `static/` folder.
- If your Pages source is set to the `docs/` folder, GitHub will serve `docs/index.html` and `docs/static/`.

Make sure `index.html` is in the root or `docs/` directory and that the folder contains the `static/` assets.
