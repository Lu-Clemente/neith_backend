const { getStorage } = require("firebase-admin/storage");

class StorageService {
    constructor(bucketName) {
        this.bucketName = bucketName;
    }

    async getDownloadURL(path) {
        const expireDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
        return (await getStorage().bucket(this.bucketName).file(path).getSignedUrl({
            action: "read",
            expires: expireDate.toISOString()
        }))[0];
    }
}

module.exports = {
    StorageService
};
