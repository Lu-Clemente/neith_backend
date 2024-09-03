const config = require("config");
const filesystem = require("fs");

const { initializeApp } = require("firebase-admin/app");
const { credential } = require("firebase-admin");
const { TravelPlanAIservice } = require("../services/ai.service");

const credentials = JSON.parse(filesystem.readFileSync(config.get("cloud.credentials_path")));
initializeApp({
    credential: credential.cert(credentials),
    projectId: config.get("cloud.project_name")
});

async function main() {
    console.log("Starting search optimizer bot");

    console.time("ai question");
    const aiService = new TravelPlanAIservice(config.get("cloud.firebase"));
    const result = await aiService.generateResponse("I'm 41 years old and planning a 10-day and i'm traveling with someonetrip to Rome. I have interest in : Local Culture and culinary experiences. My schedule is from 14PM to 12PMCould you please create a travel plan and tourist attractions, and restaurants with suggested times for every visit. Consider that i will arrive at 12PM on day 1 and departure at 08AM on last day");
    console.log(result);
    console.timeEnd("ai question");

    console.log("Finished places scraper bot");
}

main();
