import joblib
from model.chatbot import LazarusChatbot

# Load trained artifacts
vectorizer = joblib.load("vectorizer.joblib")
intent_model = joblib.load("intent_model.joblib")

# Initialize chatbot WITH fitted models
bot = LazarusChatbot(
    vectorizer=vectorizer,
    intent_model=intent_model
)

print(" AI Chatbot is running. Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        print("Goodbye 👋")
        break

    response = bot.reply(user_input)
    print("Bot:", response)
