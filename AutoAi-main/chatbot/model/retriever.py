from sklearn.metrics.pairwise import cosine_similarity

class KnowledgeRetriever:
    def __init__(self, vectorizer, knowledge_dict):
        self.vectorizer = vectorizer
        self.knowledge = knowledge_dict

    def retrieve(self, intent, query):
        chunks = self.knowledge.get(intent, [])

        if not chunks:
            return None

        vectors = self.vectorizer.transform(chunks + [query])
        sims = cosine_similarity(vectors[-1], vectors[:-1])[0]

        best_idx = sims.argmax()
        best_score = sims[best_idx]

        print("DEBUG SIMILARITY:", best_score)

        # 🔥 IMPORTANT CHANGE:
        # Always return best chunk, even if similarity is small
        return chunks[best_idx]
