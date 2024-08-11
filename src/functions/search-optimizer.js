const config = require("config");
const filesystem = require("fs");

const { PlacesService } = require("../services/places.service");
const { ReviewsService } = require("../services/reviews.service");

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
    for (let index = 0; index < places.length; index++) {
        const place = places[index];

        if(place.search) {
            console.log(`Place ${place.uid} already has search field`);
            continue;
        }

        console.log(`Optimizing place ${place.uid}`);

        const name = place.displayName.text;
        const lowerCase = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/, "");
        const keywords = lowerCase.split(" ");
        place.search = {
            keywords,
            text: lowerCase
        };
        console.log(`Updating properties ${JSON.stringify(place.search)}`);
        await placeService.updatePlace(place.uid, place);
    }

    console.log("Finished places scraper bot");
}

main();
