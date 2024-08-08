const { initializeApp } = require("firebase/app");
const { getVertexAI, getGenerativeModel } = require("firebase/vertexai-preview");

class AIService {
    constructor(firebaseConfig) {
        const firebaseApp = initializeApp(firebaseConfig);
        const vertexAI = getVertexAI(firebaseApp);
        this.model = getGenerativeModel(vertexAI, { model: "gemini-1.5-pro" });
    }

    async generateResponse(prompt) {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        return response.text();
    }
}

module.exports = {
    AIService
};
