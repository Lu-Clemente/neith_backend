const { getFirestore } = require("firebase-admin/firestore");
const { v4: uuidV4 } = require("uuid");

// eslint-disable-next-line no-unused-vars
const { TravelPlan } = require("../models/travelPlan");

class TravelPlanService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "travelPlans";
    }

    async create(data) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        const id = uuidV4();
        await getFirestore(this.databaseName).collection(this.collectionName).doc(id).set(data);
        return { ...data, id };
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
        return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    update(id, data) {
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName).collection(this.collectionName).doc(id).update(data);
    }

    createMany(items) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        items.forEach((item) => {
            item.createdAt = new Date().toISOString();
            item.updatedAt = new Date().toISOString();
            const doc = database.collection(this.collectionName).doc();
            batch.set(doc, item);
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
    TravelPlanService
};
