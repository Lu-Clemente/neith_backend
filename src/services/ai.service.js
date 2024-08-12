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

class TravelPlanAIservice extends AIService {
    constructor(firebaseConfig) {
        super(firebaseConfig);

        this.schema = {
            title: "Creating a travel plan",
            description: "",
            type: "object",
            properties: {
                days: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            schedule: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        time: { type: "string" },
                                        activity: { type: "string" },
                                        location: { type: "string" }
                                    }
                                }
                            },
                            restaurants: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        activity: { type: "string" },
                                        name: { type: "string" }
                                    }
                                }
                            }
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
        return JSON.parse(
            responseText.at(responseText.length - 1) === "\\" ?
                responseText.slice(0, responseText.length - 2) :
                responseText
        );
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
        return JSON.parse(
            responseText.at(responseText.length - 1) === "\\" ?
                responseText.slice(0, responseText.length - 2) :
                responseText
        );
    }
}

module.exports = {
    AIService,
    TravelPlanAIservice,
    QuestionsAIservice
};
