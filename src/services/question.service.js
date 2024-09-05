const { getFirestore } = require("firebase-admin/firestore");

class QuestionService {
    constructor(databaseName) {
        this.databaseName = databaseName;
    }

    createQuestions(questions) {
        const database = getFirestore(this.databaseName);
        const batch = database.batch();
        questions.forEach((data) => {
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            const doc = database.collection("questions").doc();
            batch.set(doc, data);
        });
        return batch.commit();
    }

    async findQuestions(type, subtype = null) {
        const initialQuery = getFirestore(this.databaseName).collection("questions").where("type", "==", type);
        if(subtype) initialQuery.where("subtype", "==", subtype);
        const result = await initialQuery.get();
        return result.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    }

    async getAll() {
        const result = await getFirestore(this.databaseName).collection("questions").get();
        return result.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
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
    QuestionService
};
