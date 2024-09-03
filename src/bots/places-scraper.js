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

async function getPlaces(query) {
    console.log(`Operation started for query ${query}`);

    const url = "https://places.googleapis.com/v1/places:searchText";
    const apiKey = config.get("places_scraper.maps_api_key");

    const placeService = new PlacesService(config.get("database.db_name"));
    const reviewsService = new ReviewsService(config.get("database.db_name"));

    let pageToken = "";
    let operationsCount = 0;
    do {
        console.log(`Getting places on increment ${operationsCount}`);
        const response = await fetch(
            `${url}?fields=*&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`,
            { method: "POST", body: JSON.stringify({ textQuery: query }) });
        let { places, contextualContents, nextPageToken } = await response.json();
        if (!places) places = [];
        if (!contextualContents) contextualContents = [];

        if (places.length === 0) {
            console.log("There is no places to insert");
            break;
        }

        console.log(`Found ${places.length} places, inserting`);
        await Promise.all([
            placeService.createPlaces(places.map((place) => ({...place, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}))), 
            reviewsService.createReviews(contextualContents.map((content) => ({...content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()})))
        ]);
        console.log("Places inserted successfully");

        pageToken = nextPageToken;
        if (pageToken || "") {
            console.log(`There is a page token ${pageToken}, waiting`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        operationsCount++;
        console.log("Incrementing");
    } while (pageToken);

    console.log(`Operation finished for query ${query}`);
}

async function main() {
    console.log("Starting places scraper bot");
    const queries = config.get("places_scraper.maps_queries");
    const city = "New York";
    for (let index = 0; index < queries.length; index++) {
        const query = queries[index];
        await getPlaces(query + " in " + city);
    }
    console.log("Finished places scraper bot");

    const placeService = new PlacesService(config.get("database.db_name"));
    const reviewsService = new ReviewsService(config.get("database.db_name"));
    const [placesCount, reviewsCount] = await Promise.all([placeService.count(), reviewsService.count()]);
    console.log(`Found ${placesCount.data().count} places and ${reviewsCount.data().count} reviews`);
}

main();
