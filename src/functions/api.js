const express = require("express");
const config = require("config");

const { logger } = require("firebase-functions");

const { configureUserRoutes } = require("./routes/users");
const { TagService } = require("../services/tags.service");
const { InternalException } = require("../models/errors");
const { errorHandleMiddleware } = require("../middlewares/error-handler");
const { inLog, outLog, errorLog } = require("../middlewares/logging");
const { configureTravelPlansRoutes } = require("./routes/travel-plans");
const { TravelPlansService } = require("../services/travel-plans.service");
const { UsersService } = require("../services/users.service");
const { TravelPlanAIservice } = require("../services/ai.service");
const { PlacesService } = require("../services/places.service");
const { Auth } = require("../middlewares/auth.middleware");
const { StorageService } = require("../services/storage.service");
const { QuestionsService } = require("../services/questions.service");

const app = require("express")();

app.use(express.json());

app.use(inLog(logger));

const userService = new UsersService(config.get("database.db_name"));
const travelPlansService = new TravelPlansService(config.get("database.db_name"));
const placesService = new PlacesService(config.get("database.db_name"));
const questionService = new QuestionsService(config.get("database.db_name"));
const travelPlanAIService = new TravelPlanAIservice(config.get("cloud.firebase"));
const storageService = new StorageService(config.get("cloud.storage_bucket"));
const authMiddleware = new Auth();

configureUserRoutes(app, userService, authMiddleware);
configureTravelPlansRoutes(app, travelPlansService, travelPlanAIService, userService, placesService, storageService, questionService, authMiddleware);

const tagService = new TagService();
app.get("/v1/tags/", async (_, res, next) => {
    let tags = null;
    try {
        tags = await tagService.list();
    } catch (error) {
        next(new InternalException("Error retrieving tags", error));
    }
    return res.json(tags);
});

app.use(outLog(logger));
app.use(errorLog(logger));

app.use(errorHandleMiddleware());

module.exports = {
    app
};
