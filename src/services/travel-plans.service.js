const { getFirestore } = require("firebase-admin/firestore");
const { TravelPlan } = require("../models/travelPlan");

class TravelPlansService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "travelPlans";
    }

    create(item) {
        return getFirestore(this.databaseName).collection(this.collectionName).doc().set(item);
    }

    /**
     * 
     * @param {number} userId 
     * @returns {Promise<TravelPlan[]>}
     */
    async listForUserId(userId) {
        const result = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .where("userId", "==", userId.toString())
            .get();
        return result.data();
    }

    update(id, data) {
        return getFirestore(this.databaseName).collection(this.collectionName).doc(id).update(data);
    }

    createMany(items) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        items.forEach((review) => {
            const doc = database.collection(this.collectionName).doc();
            batch.set(doc, review);
        });
        return batch.commit();
    }

    /**
     * @param {string} id 
     * @returns {Promise<TravelPlan>}
     */
    async findById(id) {
        const result = await getFirestore(this.databaseName).collection(this.collectionName).doc(id).get();
        return result.data();
    }

    /**
     * Get count of travel plans
     * @returns {Promise<number>}
     */
    async count() {
        const result = await getFirestore(this.databaseName).collection(this.collectionName).count().get();
        return result.data().count;
    }
}

module.exports = {
    TravelPlansService
};
