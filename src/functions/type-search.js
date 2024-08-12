const config = require("config");
const filesystem = require("fs");

const { PlacesService } = require("../services/places.service");

const { initializeApp } = require("firebase-admin/app");
const { credential } = require("firebase-admin");

const credentials = JSON.parse(filesystem.readFileSync(config.get("cloud.credentials_path")));
initializeApp({
    credential: credential.cert(credentials),
    projectId: config.get("cloud.project_name")
});

async function main() {
    console.log("Starting search optimizer bot");

    const placeService = new PlacesService(config.get("database.db_name"));
    const places = await placeService.getPlaces();
    const result = {};
    for (let index = 0; index < places.length; index++) {
        const place = places[index];

        for (let j = 0; j < place.types.length; j++) {
            result[place.types[j]] = "";
        }
    }

    console.log(Object.keys(result));

    console.log("Finished places scraper bot");
}

main();
