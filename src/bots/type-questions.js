const config = require("config");
const filesystem = require("fs");

const { initializeApp } = require("firebase-admin/app");
const { credential } = require("firebase-admin");
const { QuestionsAIservice } = require("../services/ai.service");
const { QuestionsService } = require("../services/questions.service");

function sleep(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

const credentials = JSON.parse(filesystem.readFileSync(config.get("cloud.credentials_path")));
initializeApp({
    credential: credential.cert(credentials),
    projectId: config.get("cloud.project_name")
});

async function main() {
    console.log("Starting search optimizer bot");

    const aiService = new QuestionsAIservice(config.get("cloud.firebase"));

    const servings = ["wine", "beer", "breakfast"];
    let servingQuestions = await Promise.all(servings.reduce((list, serving) => {
        list.push(aiService.generateResponse(`can you please write the common questions for information a tourist would ask in a restaurant that serves ${serving}? respond in english and italian`));
        return list;
    }, []));
    servingQuestions = servingQuestions.map((questions, index) => ({ questions, type: "food", subtype: servings[index] }));

    const tags = ["historical_landmark", "point_of_interest", "establishment", "park", "meal_takeaway", "vegetarian_restaurant", "restaurant", "food", "vegan_restaurant", "bar", "cafe", "bakery", "italian_restaurant", "wholesaler", "store", "tourist_attraction", "museum", "mediterranean_restaurant", "night_club", "department_store", "shopping_mall", "clothing_store", "grocery_store", "event_venue", "cultural_center", "church", "place_of_worship", "fast_food_restaurant", "brunch_restaurant", "coffee_shop", "seafood_restaurant", "pizza_restaurant", "hamburger_restaurant", "sandwich_shop", "american_restaurant", "breakfast_restaurant", "storage", "art_gallery", "liquor_store", "supermarket", "convenience_store", "locality", "political", "turkish_restaurant", "indian_restaurant", "zoo", "parking", "sports_complex", "amusement_park", "amusement_center", "jewelry_store", "sushi_restaurant", "japanese_restaurant", "meal_delivery", "sports_club", "visitor_center", "travel_agency", "landmark", "steak_house", "mosque", "dog_park", "gift_shop", "shoe_store", "sporting_goods_store", "home_goods_store", "atm", "bank", "finance", "synagogue", "general_contractor"];
    let index = 0;
    let size = 1;
    let result = [];
    while (index < tags.length) {
        const slice = tags.slice(index, index + size);
        console.log("Executing", slice.length);
        let tagQuestions = await Promise.all(slice.reduce((list, tag) => {
            list.push(aiService.generateResponse(`can you please write the common questions for information a tourist would ask in a ${tag}? respond in english and italian`));
            return list;
        }, []));
        result.push(...tagQuestions);
        console.log("Finished", slice.length);
        index += size;
        await sleep(10);
    }
    result = result.map((questions, index) => ({ questions, type: "tag", subtype: tags[index] }));

    const questionService = new QuestionsService(config.get("database.db_name"));

    await questionService.createQuestions([
        ...result, ...servingQuestions,
        {
            questions: [
                {
                    english: "Is there an accessible route to the main attractions?",
                    italian: "C'è un percorso accessibile alle principali attrazioni?"
                },
                {
                    english: "Are there seating areas available?",
                    italian: "Ci sono aree di seduta disponibili?"
                },
                {
                    english: "Is there a wheelchair rental service?",
                    italian: "C'è un servizio di noleggio sedie a rotelle?"
                },
                {
                    english: "Can I bring my own mobility aid?",
                    italian: "Posso portare il mio ausilio per la mobilità?"
                }
            ],
            type: "accessibility"
        }]);

    console.log("Finished places scraper bot");
}

main();
