const express = require("express");
const config = require("config");

const { logger } = require("firebase-functions");

const { configureUserRoutes } = require("./routes/users");
const { InternalException } = require("../models/errors");
const { errorHandleMiddleware } = require("../middlewares/error-handler");
const { inLog, outLog, errorLog } = require("../middlewares/logging");
const { configureTravelPlansRoutes } = require("./routes/travel-plans");
const { TagService } = require("../services/tag.service");
const { TravelPlanService } = require("../services/travel-plan.service");
const { UserService } = require("../services/user.service");
const { TravelPlanAIservice } = require("../services/ai.service");
const { PlaceService } = require("../services/place.service");
const { StorageService } = require("../services/storage.service");
const { QuestionService } = require("../services/question.service");
const { DestinationService } = require("../services/destination.service");

const { Auth } = require("../middlewares/auth.middleware");

const app = require("express")();

app.use(express.json());

app.use(inLog(logger));

const userService = new UserService(config.get("database.db_name"));
const travelPlansService = new TravelPlanService(config.get("database.db_name"));
const placesService = new PlaceService(config.get("database.db_name"));
const questionService = new QuestionService(config.get("database.db_name"));
const destinationService = new DestinationService(config.get("database.db_name"));
const travelPlanAIService = new TravelPlanAIservice(config.get("cloud.firebase"));
const storageService = new StorageService(config.get("cloud.storage_bucket"));
const authMiddleware = new Auth();

configureUserRoutes(app, userService, authMiddleware);
configureTravelPlansRoutes(
    app,
    travelPlansService,
    travelPlanAIService,
    userService,
    placesService,
    storageService,
    questionService,
    destinationService,
    authMiddleware
);

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
