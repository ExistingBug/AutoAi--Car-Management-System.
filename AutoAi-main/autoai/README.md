# 🚘 AutoAI India — ML Car Recommender

A **real machine learning model** (KNN + feature scoring) trained on 48 Indian cars.
No external API. Runs 100% locally with Flask.

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the model (auto-runs on first startup too)
python model_engine.py

# 3. Start the Flask server
python app.py
```

Then open **http://localhost:5000** in your browser.

## How the Model Works

1. **Dataset** — 48 Indian cars with 15+ features each (price, mileage, ground clearance, power, segment, fuel, seating, use-case tags, resale value, service ease)
2. **KNN** — K-Nearest Neighbours finds cars closest to your "ideal" feature vector
3. **Scoring** — Distance-based similarity + bonus points for city ground clearance, resale value, service network, and priority alignment
4. **City Profiles** — 13 Indian cities with road profiles (flood risk, ground clearance minimum, highway vs. city focus) injected into filtering logic

## Project Structure

```
autoai/
├── app.py              ← Flask server + API routes
├── model_engine.py     ← KNN model, training, scoring, city logic
├── dataset.py          ← 48-car Indian dataset
├── requirements.txt
├── model/
│   └── autoai_model.pkl  ← Trained model (auto-generated)
└── templates/
    └── index.html      ← Frontend (dark UI, served by Flask)
```

## API

**POST /recommend**
```json
{
  "budget_min": 10,
  "budget_max": 18,
  "fuel": "petrol",
  "segment": "compact_suv",
  "seating": 5,
  "priority": "mileage",
  "use_case": ["city", "family"],
  "city": "Mumbai"
}
```
