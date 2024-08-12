const { getFirestore } = require("firebase-admin/firestore");
const { v4: uuidV4 } = require("uuid");

// eslint-disable-next-line no-unused-vars
const { User } = require("../models/user");

class UsersService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "users";
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

    async create(data) {
        const id = uuidV4();
        await getFirestore(this.databaseName).collection(this.collectionName).doc(id).create(data);
        return { ...data, id };
    }

    update(id, data) {
        return getFirestore(this.databaseName).collection(this.collectionName).doc(id).update(data);
    }

    /**
     * @param {number} id
     * @returns {Promise<User>}
     */
    async findById(id) {
        const result = await getFirestore(this.databaseName).collection(this.collectionName).doc(id).get();
        return result.data();
    }

    /**
     * @param {String} externalId 
     * @returns {Promise<User>}
     */
    async findByExternalId(externalId) {
        const result = await getFirestore(this.databaseName).collection(this.collectionName).where("externalId", "==", externalId).get();
        if(!result.docs) return null;
        return {...result.docs[0].data(), id: result.docs[0].id};
    }

    /**
     * Get count of places
     * @return {Promise<number>}
     */
    async count() {
        const result = await getFirestore(this.databaseName)
            .collection(this.collectionName)
            .count()
            .get();
        return result.data().count;
    }
}

module.exports = {
    UsersService,
};
