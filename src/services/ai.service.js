const { initializeApp } = require("firebase/app");
const { getVertexAI, getGenerativeModel } = require("firebase/vertexai-preview");

class AIService {
    constructor(firebaseConfig) {
        const firebaseApp = initializeApp(firebaseConfig);
        const vertexAI = getVertexAI(firebaseApp);
        this.model = getGenerativeModel(vertexAI, { model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
    }

    async generateResponse(prompt) {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        return response.text();
    }
}

function trimNonJSON(text) {
    if (text[text.length - 1] === "}" && text[0] === "{") return text;

    const startIndex = text.indexOf("{");
    if (startIndex === -1) return null;

    const endIndex = text.lastIndexOf("}");
    if (endIndex === -1) return null;

    return text.slice(startIndex, endIndex - startIndex + 1);
}

class TravelPlanAIservice extends AIService {
    constructor(firebaseConfig) {
        super(firebaseConfig);

        this.schema = {
            title: "Creating a travel plan",
            description: "",
            type: "object",
            properties: {
                places: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            day: { type: "number" },
                            time: { type: "number" },
                            activity: { type: "string" },
                            originalName: { type: "string" },
                            translatedName: { type: "string" },
                            isRestaurant: { type: "boolean" },
                            latitude: { type: "number" },
                            longitude: { type: "number" }
                        }
                    }
                },
                tips: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        };
    }

    async generateResponse(prompt) {
        const schema = { ...this.schema };
        schema.description = prompt;

        const result = await this.model.generateContent(`Follow JSON schema.<JSONSchema>${JSON.stringify(schema)}</JSONSchema>`);
        const response = result.response;
        let responseText = response.text();
        return JSON.parse(trimNonJSON(responseText));
    }
}

class QuestionsAIservice extends AIService {
    constructor(firebaseConfig) {
        super(firebaseConfig);

        this.schema = {
            title: "Creating questions for default locations",
            description: "",
            type: "array",
            items: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    english: { type: "string" },
                    italian: { type: "string" }
                }
            }
        };
    }

    async generateResponse(prompt) {
        const schema = { ...this.schema };
        schema.description = prompt;

        const result = await this.model.generateContent(`Follow JSON schema.<JSONSchema>${JSON.stringify(schema)}</JSONSchema>`);
        const response = result.response;
        let responseText = response.text();
        return JSON.parse(trimNonJSON(responseText));
    }
}

module.exports = {
    AIService,
    TravelPlanAIservice,
    QuestionsAIservice
};
