const { getFirestore } = require("firebase-admin/firestore");

class ReviewsService {
    constructor(databaseName) {
        this.databaseName = databaseName;
    }

    createReviews(reviews) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        reviews.forEach((data) => {
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            const doc = database.collection("placeReviews").doc();
            batch.set(doc, data);
        });
        return batch.commit();
    }

    /**
     * Get count of places
     * @returns {Promise<number>}
     */
    count() {
        return getFirestore(this.databaseName).collection("placeReviews").count().get();
    }
}

module.exports = {
    ReviewsService
};
