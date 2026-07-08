import json
import re
import random
from model.intent_classifier import IntentClassifier
from model.retriever import KnowledgeRetriever
from model.response_composer import ResponseComposer


# -------------------------
# Text cleaning
# -------------------------
def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# -------------------------
# Keyword-based intent rules
# ORDER MATTERS (specific → general)
# -------------------------
KEYWORD_INTENTS = [
    # Greetings
    ("hello", "greeting"),
    ("hi", "greeting"),
    ("hey", "greeting"),
    ("good morning", "greeting"),
    ("good evening", "greeting"),
    ("good afternoon", "greeting"),
    ("howdy", "greeting"),

    # Thanks
    ("thank you", "thanks"),
    ("thanks", "thanks"),
    ("thx", "thanks"),
    ("great help", "thanks"),
    ("helpful", "thanks"),

    # Engine oil
    ("engine oil", "engine_oil"),
    ("oil change", "engine_oil"),
    ("5w30", "engine_oil"),
    ("10w40", "engine_oil"),
    ("synthetic oil", "engine_oil"),
    ("mineral oil", "engine_oil"),

    # Tyres
    ("tyre pressure", "tyre_maintenance"),
    ("tire pressure", "tyre_maintenance"),
    ("tyre rotation", "tyre_maintenance"),
    ("wheel alignment", "tyre_maintenance"),
    ("tread depth", "tyre_maintenance"),
    ("puncture", "tyre_maintenance"),
    ("tyre wear", "tyre_maintenance"),
    ("tyre age", "tyre_maintenance"),
    ("nitrogen tyre", "tyre_maintenance"),

    # Battery
    ("car battery", "car_battery"),
    ("jump start", "car_battery"),
    ("battery dead", "car_battery"),
    ("battery drain", "car_battery"),
    ("amaron", "car_battery"),
    ("exide battery", "car_battery"),

    # AC
    ("car ac", "car_ac"),
    ("ac not cooling", "car_ac"),
    ("ac refrigerant", "car_ac"),
    ("cabin filter", "car_ac"),
    ("cabin air filter", "car_ac"),
    ("ac smell", "car_ac"),
    ("ac gas", "car_ac"),
    ("air conditioning", "car_ac"),

    # Brakes
    ("brake pad", "brake_maintenance"),
    ("brake noise", "brake_maintenance"),
    ("brake fluid", "brake_maintenance"),
    ("disc brake", "brake_maintenance"),
    ("drum brake", "brake_maintenance"),
    ("brake squeal", "brake_maintenance"),
    ("grinding brake", "brake_maintenance"),
    ("brake rotor", "brake_maintenance"),

    # Fuel efficiency
    ("fuel efficiency", "fuel_efficiency"),
    ("improve mileage", "fuel_efficiency"),
    ("mileage low", "fuel_efficiency"),
    ("fuel saving", "fuel_efficiency"),
    ("arai mileage", "fuel_efficiency"),
    ("idle fuel", "fuel_efficiency"),
    ("economy mode", "fuel_efficiency"),

    # Petrol vs diesel
    ("petrol vs diesel", "petrol_vs_diesel"),
    ("cng car", "petrol_vs_diesel"),
    ("electric vs petrol", "petrol_vs_diesel"),
    ("diesel worth", "petrol_vs_diesel"),
    ("hybrid car", "petrol_vs_diesel"),

    # ADAS
    ("adas", "adas"),
    ("automatic emergency braking", "adas"),
    ("lane departure", "adas"),
    ("blind spot", "adas"),
    ("adaptive cruise", "adas"),
    ("forward collision", "adas"),
    ("parking assist", "adas"),
    ("360 camera", "adas"),
    ("driver assist", "adas"),

    # Insurance
    ("zero depreciation", "car_insurance"),
    ("comprehensive insurance", "car_insurance"),
    ("third party insurance", "car_insurance"),
    ("ncb", "car_insurance"),
    ("no claim bonus", "car_insurance"),
    ("idv", "car_insurance"),
    ("engine protection insurance", "car_insurance"),
    ("roadside assistance insurance", "car_insurance"),
    ("return to invoice", "car_insurance"),

    # Insurance claim
    ("insurance claim", "car_insurance_claim"),
    ("file claim", "car_insurance_claim"),
    ("cashless claim", "car_insurance_claim"),
    ("claim rejected", "car_insurance_claim"),
    ("fir for insurance", "car_insurance_claim"),

    # Insurance renewal
    ("insurance renewal", "car_insurance_renewal"),
    ("insurance lapsed", "car_insurance_renewal"),
    ("renew insurance", "car_insurance_renewal"),
    ("port ncb", "car_insurance_renewal"),

    # EMI and loan
    ("car loan", "car_loan_emi"),
    ("emi calculate", "car_loan_emi"),
    ("down payment", "car_loan_emi"),
    ("loan interest", "car_loan_emi"),
    ("car loan tenure", "car_loan_emi"),
    ("processing fee", "car_loan_emi"),
    ("foreclosure loan", "car_loan_emi"),

    # Buying tips
    ("buying a car", "car_buying_tips"),
    ("on road price", "car_buying_tips"),
    ("ex showroom", "car_buying_tips"),
    ("negotiate car", "car_buying_tips"),
    ("test drive", "car_buying_tips"),
    ("rto registration", "car_buying_tips"),
    ("gst on car", "car_buying_tips"),
    ("certified pre-owned", "car_buying_tips"),
    ("waiting period", "car_buying_tips"),
    ("dealer charges", "car_buying_tips"),

    # Ground clearance
    ("ground clearance", "ground_clearance"),

    # Safety ratings
    ("ncap", "safety_ratings"),
    ("crash test", "safety_ratings"),
    ("airbags", "safety_ratings"),
    ("safety rating", "safety_ratings"),
    ("bharat ncap", "safety_ratings"),

    # Maintenance schedule
    ("service schedule", "car_maintenance_schedule"),
    ("free service", "car_maintenance_schedule"),
    ("first service", "car_maintenance_schedule"),
    ("timing belt", "car_maintenance_schedule"),
    ("transmission fluid", "car_maintenance_schedule"),

    # EV range
    ("ev range", "ev_range"),
    ("electric car range", "ev_range"),
    ("dc fast charging", "ev_range"),
    ("charging station", "ev_range"),
    ("charge at home", "ev_range"),
    ("range anxiety", "ev_range"),
    ("nexon ev", "ev_range"),

    # EV maintenance
    ("ev maintenance", "ev_maintenance"),
    ("ev battery", "ev_maintenance"),
    ("regenerative braking", "ev_maintenance"),
    ("ev oil change", "ev_maintenance"),
    ("ev battery health", "ev_maintenance"),

    # Documents
    ("upload document", "document_storage"),
    ("store document", "document_storage"),
    ("vehicle document", "document_storage"),
    ("digital document", "document_storage"),
    ("rc upload", "document_storage"),
    ("puc upload", "document_storage"),

    # PUC
    ("puc certificate", "puc_certificate"),
    ("pollution certificate", "puc_certificate"),
    ("puc validity", "puc_certificate"),
    ("puc test", "puc_certificate"),
    ("puc fine", "puc_certificate"),

    # Challan
    ("challan", "challan_tracking"),
    ("traffic fine", "challan_tracking"),
    ("echallan", "challan_tracking"),
    ("traffic violation", "challan_tracking"),

    # Reminders
    ("set reminder", "challan_reminders"),
    ("renewal reminder", "challan_reminders"),
    ("document expiry", "challan_reminders"),
    ("notification for", "challan_reminders"),

    # AI recommendation
    ("car recommendation", "ai_car_recommendation"),
    ("suggest car", "ai_car_recommendation"),
    ("best car under", "ai_car_recommendation"),
    ("car for family", "ai_car_recommendation"),
    ("car for city", "ai_car_recommendation"),
    ("knn car", "ai_car_recommendation"),

    # Resale
    ("resale value", "resale_value"),
    ("sell my car", "resale_value"),
    ("car depreciation", "resale_value"),
    ("cars24", "resale_value"),
    ("spinny", "resale_value"),

    # Coolant
    ("coolant", "coolant"),
    ("overheating", "coolant"),
    ("radiator", "coolant"),
    ("temperature gauge", "coolant"),

    # Spark plugs
    ("spark plug", "spark_plugs"),
    ("iridium plug", "spark_plugs"),
    ("glow plug", "spark_plugs"),
    ("misfire", "spark_plugs"),

    # Seating
    ("7 seater", "seating_capacity"),
    ("7 seat", "seating_capacity"),
    ("large family car", "seating_capacity"),
    ("mpv", "seating_capacity"),
    ("captain seat", "seating_capacity"),

    # Sunroof
    ("sunroof", "sunroof"),
    ("panoramic", "sunroof"),

    # Transmission
    ("manual vs automatic", "transmission"),
    ("amt gearbox", "transmission"),
    ("dct gearbox", "transmission"),
    ("cvt transmission", "transmission"),
    ("automatic car", "transmission"),

    # Fuel types
    ("premium petrol", "fuel_types_india"),
    ("bs6 fuel", "fuel_types_india"),
    ("wrong fuel", "fuel_types_india"),
    ("diesel in petrol", "fuel_types_india"),

    # Car washing
    ("wash car", "car_washing"),
    ("ceramic coating", "car_washing"),
    ("car wax", "car_washing"),
    ("bird dropping", "car_washing"),
    ("car polish", "car_washing"),
    ("nano coating", "car_washing"),

    # Maintenance section
    ("log service", "maintenance_section"),
    ("service record", "maintenance_section"),
    ("maintenance log", "maintenance_section"),

    # Platform
    ("vahansathi", "platform_overview"),
    ("what is this app", "platform_overview"),
    ("how does this work", "platform_overview"),

    # Platform identity
    ("who created vahansathi", "platform_identity"),
    ("who made this", "platform_identity"),
    ("who owns", "platform_identity"),

    # Account
    ("forgot password", "account_access"),
    ("reset password", "account_access"),
    ("login", "account_access"),
    ("sign in", "account_access"),
    ("create account", "account_access"),

    # Data security
    ("data secure", "data_security"),
    ("is my data", "data_security"),
    ("privacy", "data_security"),
    ("encryption", "data_security"),
]


# -------------------------
# Chatbot
# -------------------------
class LazarusChatbot:
    def __init__(self, vectorizer, intent_model):

        # Load knowledge base
        with open("data/knowledge_base.json", encoding="utf-8") as f:
            self.knowledge = json.load(f)

        # Load response templates
        with open("data/response_templates.json", encoding="utf-8") as f:
            templates = json.load(f)

        # Intent classifier (ML)
        self.classifier = IntentClassifier()
        self.classifier.vectorizer = vectorizer
        self.classifier.model = intent_model

        # Retriever
        self.retriever = KnowledgeRetriever(vectorizer, self.knowledge)

        # Composer
        self.composer = ResponseComposer(templates)

    def match_keyword_intent(self, cleaned_text: str):
        for keyword, intent in KEYWORD_INTENTS:
            if keyword in cleaned_text:
                return intent
        return None

    def reply(self, user_text: str) -> str:

        cleaned = clean_text(user_text)

        # 1️⃣ Try keyword rules first
        keyword_intent = self.match_keyword_intent(cleaned)

        if keyword_intent:
            intent = keyword_intent
        else:
            # 2️⃣ Fall back to ML classifier
            intent = self.classifier.predict(cleaned)

        # 3️⃣ Retrieve knowledge
        knowledge = self.retriever.retrieve(intent, cleaned)

        # 4️⃣ Fallback to fallback intent if no knowledge found
        if knowledge is None:
            fallback_answers = self.knowledge.get("fallback", [])
            if fallback_answers:
                return random.choice(fallback_answers)
            return (
                "I specialize in car maintenance, insurance, buying tips, fuel, ADAS, "
                "and the VahanSathi platform. Could you rephrase or ask something in those areas?"
            )

        # 5️⃣ Compose final answer
        return self.composer.compose(knowledge)
