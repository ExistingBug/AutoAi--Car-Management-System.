import axios from 'axios';

const autoaiClient = axios.create({
    baseURL: import.meta.env.VITE_AUTOAI_URL || 'http://localhost:5000',
    headers: { 'Content-Type': 'application/json' },
});

/**
 * POST /recommend — returns top car recommendations from the KNN model.
 * @param {Object} payload — budget, fuel, city, features, etc.
 */
export async function getRecommendations(payload) {
    const { data } = await autoaiClient.post('/recommend', payload);
    return data;
}

/**
 * POST /ask — send a question to the FAQ chatbot.
 * @param {string} question
 */
export async function askChatbot(question) {
    const { data } = await autoaiClient.post('/ask', { question });
    return data;
}
