const config = require("config");
const filesystem = require("fs");

const { PlacesService } = require("../services/places.service");
const { ReviewsService } = require("../services/reviews.service");

const { initializeApp } = require("firebase-admin/app");
const { credential } = require("firebase-admin");
const { default: axios } = require("axios");
const { getStorage } = require("firebase-admin/storage");

const { v4: uuidV4 } = require("uuid");

const credentials = JSON.parse(filesystem.readFileSync(config.get("cloud.credentials_path")));
initializeApp({
    credential: credential.cert(credentials),
    projectId: config.get("cloud.project_name")
});

async function getPlaces(query) {
    console.log(`Operation started for query ${query}`);

    const url = "https://places.googleapis.com/v1";
    const apiKey = config.get("places_scraper.maps_api_key");

    const placeService = new PlacesService(config.get("database.db_name"));
    const places = await placeService.getPlaces();

    const storage = getStorage().bucket(config.get("cloud.storage_bucket"));

    for (let index = 0; index < places.length; index++) {
        const place = places[index];
        if (!place.photos || place.photos.length === 0 || place.photoPath) {
            console.log("Place does not contain photos");
            continue;
        }

        console.log(`Getting place ${place.displayName.text} (${place.uid})`);

        const photoName = place.photos[0]?.name;
        const filePath = `./data/temp/photos/${place.uid}.jpg`;
        const writeStream = filesystem.createWriteStream(filePath);
        try {
            console.log(`Getting photo with ${photoName}`);
            await axios.get(`${url}/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`,
                { responseType: "stream" })
                .then((output) => {
                    return new Promise((resolve, reject) => {
                        output.data.pipe(writeStream);
                        error = null;
                        writeStream.on("error", (err) => {
                            writeStream.close();
                            error = err;
                            reject(err);
                        });
                        writeStream.on("close", () => {
                            if (error) return;

                            resolve();
                        });
                    });
                });
        } catch (error) {
            console.log(error);
            continue;
        }

        const photoId = uuidV4();
        const photoPath = `places/${place.uid}/${photoId}.jpg`;
        
        console.log(`Uploading file ${photoPath}`);
        await storage.upload(filePath, { destination: photoPath });
        
        console.log(`Updating photo path in document ${place.uid}`);
        place.photoPath = photoPath;
        await placeService.updatePlace(place.uid, place);
        
        console.log(`Deleting file ${filePath}`);
        await filesystem.promises.unlink(filePath);
    }

    console.log(`Operation finished for query ${query}`);
}

async function main() {
    console.log("Starting places scraper bot");
    const queries = config.get("places_scraper.maps_queries");
    for (let index = 0; index < queries.length; index++) {
        const query = queries[index];
        await getPlaces(query);
    }
    console.log("Finished places scraper bot");

    const placeService = new PlacesService(config.get("database.db_name"));
    const reviewsService = new ReviewsService(config.get("database.db_name"));
    const [placesCount, reviewsCount] = await Promise.all([placeService.count(), reviewsService.count()]);
    console.log(`Found ${placesCount.data().count} places and ${reviewsCount.data().count} reviews`);
}

main();
