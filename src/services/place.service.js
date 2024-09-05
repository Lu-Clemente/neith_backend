const { getFirestore } = require("firebase-admin/firestore");

// eslint-disable-next-line no-unused-vars
const { Place } = require("../models/place");

class PlaceService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "places";
    }

    /**
     * Creates a new place
     * @param {Place} data The place to create
     * @returns {Promise<Place>}
     */
    createPlace(data) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName).collection(this.collectionName).add(data);
    }

    /**
     * Creates multiple places
     * @param {Place[]} items The places to create
     * @returns {Promise<Place[]>}
     */
    createPlaces(items) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        items.forEach((data) => {
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            const doc = database.collection(this.collectionName).doc();
            batch.set(doc, data);
        });
        return batch.commit();
    }

    /**
     * Get count of places
     * @returns {Promise<number>}
     */
    count() {
        return getFirestore(this.databaseName).collection(this.collectionName).count().get();
    }

    async findRestaurants() {
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .where("primaryType", "==", "restaurant")
            .get();
        return response.data();
    }

    async searchPaginated(offset = 0, limit = 20, text = "") {
        const treatedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/, "");
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .where("search.text", ">=", treatedText)
            .where("search.text", "<=", treatedText + "\uf8ff")
            .where("search.keywords", "array-contains", treatedText)
            .offset(offset)
            .limit(limit)
            .get();

        const result = response.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        return result;
    }

    async searchOne(text = "") {
        const result = await this.searchPaginated(0, 1, text);
        return result.length < 1 ? null : result[0];
    }

    updatePlace(id, data) {
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName)
            .collection(this.collectionName)
            .doc(id)
            .set(data);
    }

    async getPlaces() {
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .get();

        const result = response.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        return result;
    }
}

module.exports = {
    PlaceService
};