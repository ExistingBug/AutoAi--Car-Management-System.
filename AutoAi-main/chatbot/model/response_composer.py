import random

class ResponseComposer:
    def __init__(self, templates):
        self.templates = templates

    def compose(self, knowledge_text):
        return " ".join([
            random.choice(self.templates["intro"]),
            knowledge_text,
            random.choice(self.templates["closing"])
        ])
