const config = require("config");
const filesystem = require("fs");

const { TravelPlansService } = require("../services/travel-plans.service");

const { initializeApp } = require("firebase-admin/app");
const { credential } = require("firebase-admin");

const credentials = JSON.parse(filesystem.readFileSync(config.get("cloud.credentials_path")));
initializeApp({
    credential: credential.cert(credentials),
    projectId: config.get("cloud.project_name")
});

async function main() {
    console.log("Starting get travel plan bot");
    const travelPlanService = new TravelPlansService(config.get("database.db_name"));
    const plan = await travelPlanService.findById("41c4b895-f5fc-4e31-be4e-924375cc56e8");
    filesystem.writeFileSync("output.json", JSON.stringify(plan));
    console.log("Finished get travel plan bot");
}

main();