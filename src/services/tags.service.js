const { getFirestore } = require("firebase-admin/firestore");

class TagService {
    constructor(databaseName) {
        this.databaseName = databaseName;
    }

    async list() {
        const [disabilities, restaurantDietTags, tourismTypes] = await Promise.all([
            getFirestore(this.databaseName).collection("disabilities").get(),
            getFirestore(this.databaseName).collection("restaurantDietTags").get(),
            getFirestore(this.databaseName).collection("tourismTypes").get()]);

        return {
            disabilities: disabilities.docs.map((doc) => doc.data()),
            restaurantDietTags: restaurantDietTags.docs.map((doc) => doc.data()),
            tourismTypes: tourismTypes.docs.map((doc) => doc.data())
        };
    }
}

module.exports = {
    TagService
};
