"""
AutoAI India — Flask Backend
Serves frontend pages and exposes ML API endpoints
"""

import pickle
import os
import sys
from flask import Flask, render_template, request, jsonify
from model_engine import recommend, train_and_save, CITY_PROFILES

# ─────────────────────────────────────────────────────────────
# Chatbot Setup (merged from /chatbot folder)
# ─────────────────────────────────────────────────────────────
CHATBOT_DIR = os.path.join(os.path.dirname(__file__), "..", "chatbot")
CHATBOT_DIR = os.path.abspath(CHATBOT_DIR)

if CHATBOT_DIR not in sys.path:
    sys.path.insert(0, CHATBOT_DIR)

import joblib
from model.chatbot import LazarusChatbot

_vec   = joblib.load(os.path.join(CHATBOT_DIR, "vectorizer.joblib"))
_model = joblib.load(os.path.join(CHATBOT_DIR, "intent_model.joblib"))

# Patch chatbot data path so it reads from the chatbot folder
_orig_dir = os.getcwd()
os.chdir(CHATBOT_DIR)
_chatbot = LazarusChatbot(vectorizer=_vec, intent_model=_model)
os.chdir(_orig_dir)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "vahansathi-dev-secret-key-change-in-prod")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

# ─────────────────────────────────────────────────────────────
# Auth Blueprint (login, logout, register, image uploads)
# ─────────────────────────────────────────────────────────────
from auth import auth_bp, init_db
app.register_blueprint(auth_bp)

with app.app_context():
    init_db()

# ─────────────────────────────────────────────────────────────
# Model Load
# ─────────────────────────────────────────────────────────────

MODEL_PATH = "model/autoai_model.pkl"

def load_bundle():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    print("⚠ Model not found — training now...")
    return train_and_save()

BUNDLE = load_bundle()
print(f"✅ Model loaded — {len(BUNDLE['df'])} cars in database")

# ─────────────────────────────────────────────────────────────
# Frontend Routes
# ─────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/chat")
def chat():
    return render_template("chatbot.html")

@app.route("/documents")
def documents():
    return render_template("documents.html")

@app.route("/maintenance")
def maintenance():
    return render_template("maintenance.html")

@app.route("/faq")
def faq():
    return render_template("faq_chat.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/carsearch")
def carsearch():
    return render_template("carsearch.html")

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    if not data or "question" not in data:
        return jsonify({"error": "Missing question"}), 400
    answer = _chatbot.reply(data["question"])
    return jsonify({"question": data["question"], "answer": answer})

@app.route("/login")
def login():
    return render_template("login.html")

# ─────────────────────────────────────────────────────────────
# ML Recommendation API
# ─────────────────────────────────────────────────────────────

@app.route("/recommend", methods=["POST"])
def get_recommendations():
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "No JSON received"}), 400

    try:
        budget_min = float(data.get("budget_min") or 0)
        budget_max = float(data.get("budget_max") or 100)
        fuel       = (data.get("fuel") or "any").lower()
        seating    = int(data.get("seating") or 1)
        priority   = data.get("priority") or "balanced"
        use_case   = data.get("use_case") or []
        city       = data.get("city") or "Other City"
        segment    = data.get("segment") or ""

        transmission      = data.get("transmission", "")
        min_safety_rating = int(data.get("min_safety_rating") or 0)
        min_airbags       = int(data.get("min_airbags") or 0)
        warranty_years    = int(data.get("warranty_years") or 0)
        brand_origin      = data.get("brand_origin", "")

        sunroof           = data.get("sunroof", False)
        adas              = data.get("adas", False)
        wireless_charging = data.get("wireless_charging", False)
        cruise_control    = data.get("cruise_control", False)
        parking_sensors   = data.get("parking_sensors", False)

        user_input = {
            "budget_min": budget_min,
            "budget_max": budget_max,
            "fuel": fuel,
            "seating": seating,
            "priority": priority,
            "use_case": use_case,
            "city": city,
            "segment": segment,
            "transmission": transmission,
            "min_safety_rating": min_safety_rating,
            "min_airbags": min_airbags,
            "warranty_years": warranty_years,
            "brand_origin": brand_origin,
            "sunroof": sunroof,
            "adas": adas,
            "wireless_charging": wireless_charging,
            "cruise_control": cruise_control,
            "parking_sensors": parking_sensors,
        }

        results = recommend(user_input, BUNDLE, top_n=3)

        return jsonify({
            "success": True,
            "recommendations": results,
            "city": city
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ─────────────────────────────────────────────────────────────
# Utility APIs
# ─────────────────────────────────────────────────────────────

@app.route("/cars")
def all_cars():
    df = BUNDLE["df"]
    cars = df.fillna("").to_dict(orient="records")
    return jsonify(cars)

@app.route("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "cars_loaded": len(BUNDLE["df"])
    })

# ─────────────────────────────────────────────────────────────
# Run Server
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)