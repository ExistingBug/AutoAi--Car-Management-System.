import pandas as pd
import joblib
from model.intent_classifier import IntentClassifier

df = pd.read_csv("data/intents.csv")

print("Columns:", df.columns.tolist())
print("Missing values:\n", df.isna().sum())

df = df.dropna()

clf = IntentClassifier()
clf.train(df["text"], df["intent"])

joblib.dump(clf.vectorizer, "vectorizer.joblib")
joblib.dump(clf.model, "intent_model.joblib")

print("Model trained successfully")
