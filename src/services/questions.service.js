const { getFirestore } = require("firebase-admin/firestore");

class QuestionsService {
    constructor(databaseName) {
        this.databaseName = databaseName;
    }

    createQuestions(questions) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        questions.forEach((review) => {
            const doc = database.collection("questions").doc();
            batch.set(doc, review);
        });
        return batch.commit();
    }

    async findQuestions(type, subtype = null) {
        const initialQuery = getFirestore(this.databaseName).collection("questions").where("type", "==", type);
        if(subtype) initialQuery.where("subtype", "==", subtype);
        const result = await initialQuery.get();
        return result.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
    }

    async getAll() {
        const result = await getFirestore(this.databaseName).collection("questions").get();
        return result.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
    }

    /**
     * Get count of places
     * @returns {Promise<number>}
     */
    count() {
        return getFirestore(this.databaseName).collection("questions").count().get();
    }
}

module.exports = {
    QuestionsService
};
