from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

from model.chatbot import LazarusChatbot

app = Flask(__name__)
CORS(app)  # allows external webpages to call this API

# Load chatbot once
vectorizer = joblib.load("vectorizer.joblib")
intent_model = joblib.load("intent_model.joblib")

chatbot = LazarusChatbot(
    vectorizer=vectorizer,
    intent_model=intent_model
)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Missing question"}), 400

    question = data["question"]
    answer = chatbot.reply(question)

    return jsonify({
        "question": question,
        "answer": answer
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
