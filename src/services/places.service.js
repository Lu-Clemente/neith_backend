const { getFirestore } = require("firebase-admin/firestore");

// eslint-disable-next-line no-unused-vars
const { Place } = require("../models/place");

class PlacesService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "places";
    }

    /**
     * Creates a new place
     * @param {Place} place The place to create
     * @returns {Promise<Place>}
     */
    createPlace(place) {
        return getFirestore(this.databaseName).collection(this.collectionName).add(place);
    }

    /**
     * Creates multiple places
     * @param {Place[]} places The places to create
     * @returns {Promise<Place[]>}
     */
    createPlaces(places) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        places.forEach((place) => {
            const doc = database.collection(this.collectionName).doc();
            batch.set(doc, place);
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

    /**
     * Updates the increment_id to the latest index
     * @param {DocumentReference} itemRef 
     * @param {number} incrementId 
     * @returns {Promise<void>}
     */
    updateIncrementId(itemRef, incrementId) {
        return itemRef.set({ increment_id: incrementId }, { merge: true })
    }

    /**
     * Retrieves the last increment_id stored in the database
     * @returns {Promise<number>}
     */
    async getLastIncrementId() {
        const response = await getFirestore()
            .collection("items")
            .orderBy("increment_id", "desc")
            .limit(1)
            .get();

        if (response.docs.length === 0) return 0;
        return response.docs[0].data().increment_id;
    }

    async findRestaurants() {
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .where("primaryType", "==", "restaurant")
            .get();
        return response.data();
    }

    async searchPaginated(offset = 0, limit = 20, text = "") {
        const response = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .where("displayName.text", ">=", text)
            .where("displayName.text", "<=", text + "\uf8ff")
            .offset(offset)
            .limit(limit)
            .get();

        const result = response.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        return result;
    }

    updatePlace(id, data) {
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
    PlacesService
};