const { getFirestore } = require("firebase-admin/firestore");

class EventService {
    constructor(databaseName) {
        this.databaseName = databaseName;
        this.collectionName = "events";
    }

    create(data) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        return getFirestore(this.databaseName).collection(this.collectionName).add(data);
    }

    count() {
        return getFirestore(this.databaseName).collection(this.collectionName).count().get();
    }
}

module.exports = {
    EventService
};