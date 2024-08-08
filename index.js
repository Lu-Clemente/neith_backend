const { app } = require("./src/functions/api");

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

module.exports = {
    api: functions.https.onRequest(app),
};
