const { getFirestore } = require("firebase-admin/firestore");

// eslint-disable-next-line no-unused-vars
const { Destination } = require("../models/destination");

class DestinationService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "destinations";
    }

    /**
     * Creates a new destination
     * @param {Destination} data The destination to create
     * @returns {Promise<Destination>}
     */
    createDestination(data) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName).collection(this.collectionName).add(data);
    }

    /**
     * Creates multiple destinations
     * @param {Destination[]} items The destinations to create
     * @returns {Promise<Destination[]>}
     */
    createDestinations(items) {
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
     * Get count of destinations
     * @returns {Promise<number>}
     */
    count() {
        return getFirestore(this.databaseName).collection(this.collectionName).count().get();
    }

    async searchPaginated(offset = 0, limit = 20, text = "") {
        const treatedText = text.toLowerCase().normalize("NFD").redestination(/[\u0300-\u036f]/g, "").redestination(/[^\w\s]/, "");
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

    updateDestination(id, data) {
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName)
            .collection(this.collectionName)
            .doc(id)
            .set(data);
    }

    async getDestinations() {
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .get();

        const result = response.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        return result;
    }
}

module.exports = {
    DestinationService
};