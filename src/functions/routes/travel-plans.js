const schemas = require("./schemas");

const { validateInput } = require("../../middlewares/input-validation");
const { NotFoundException, InternalException } = require("../../models/errors");

/* eslint-disable no-unused-vars */
const { TravelPlansService } = require("../../services/travel-plans.service");
const { TravelPlanAIservice } = require("../../services/ai.service");
const { UsersService } = require("../../services/users.service");
const { Auth } = require("../../middlewares/auth.middleware");
const { PlacesService } = require("../../services/places.service");
const { StorageService } = require("../../services/storage.service");
const { QuestionsService } = require("../../services/questions.service");
const { logger } = require("firebase-functions");
/* eslint-enable no-unused-vars */

function formatHour(hour) {
    if (hour > 12) return `${hour - 12} PM`;
    if (hour === 12) return "12 PM";

    return `${hour} AM`;
}

function convertPreferredTimeToText(prefferedTime) {
    let min = 24;
    let max = 0;
    if (prefferedTime.includes("morning")) {
        min = 7;
        max = max > 11 ? max : 11;
    }
    if (prefferedTime.includes("afternoon")) {
        min = min < 12 ? min : 12;
        max = max > 17 ? max : 17;
    }
    if (prefferedTime.includes("night")) {
        min = min < 18 ? min : 18;
        max = 23;
    }

    return `${formatHour(min)} to ${formatHour(max)}`;
}

/**
 * @param {Express.Application} app 
 * @param {TravelPlansService} travelPlansService
 * @param {TravelPlanAIservice} aiService 
 * @param {UsersService} userService 
 * @param {PlacesService} placesService 
 * @param {StorageService} storageService 
 * @param {QuestionsService} questionService 
 * @param {Auth} authMiddleware 
 */
function configureTravelPlansRoutes(app, travelPlansService, aiService, userService, placesService, storageService, questionService, authMiddleware) {
    app.get("/v1/travel-plans/", validateInput(schemas.getTravelPlans), authMiddleware.authenticate(), async (req, res, next) => {
        const { externalId } = req.state.user;

        let user = null;
        try {
            user = await userService.findByExternalId(externalId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding user ${externalId}`, error));
        }

        if (!user) return next(new NotFoundException(`An error occurred finding user ${externalId}`));

        let travelPlans = null;
        try {
            travelPlans = await travelPlansService.listForUserId(user.id);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plans for user ${user.id}`, error));
        }

        return res.json(travelPlans);
    });

    app.get("/v1/places", validateInput(schemas.getPlaces), authMiddleware.authenticate(), async (req, res, next) => {
        const { offset, limit, text } = req.state.input.query;

        let places = [];
        try {
            places = await placesService.searchPaginated(offset, limit, text);

            const photos = await Promise.all(
                places.map((place) => Promise.all([
                    place.photoPath ? storageService.getDownloadURL(place.photoPath) : Promise.resolve(""),
                    place.thumbPath ? storageService.getDownloadURL(place.thumbPath) : Promise.resolve(""),
                ])));

            places = places.map((place, index) => {
                place.photoUrl = photos[index][0];
                place.thumbUrl = photos[index][1];
                return place;
            });
        } catch (error) {
            return next(new InternalException("An error occurred finding places", error));
        }

        return res.json(places);
    });

    app.post("/v1/travel-plans/", validateInput(schemas.postTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { externalId } = req.state.user;

        let user = null;
        try {
            user = await userService.findByExternalId(externalId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding user ${externalId}`, error));
        }

        if (!user) return next(new NotFoundException(`An error occurred finding user ${externalId}`));

        const data = req.state.input.body;

        let travelPlan = null;
        try {
            data.userId = user.id;
            data.thumbPath = "places/ru8d5eWqMKUU9GVmaMAc/eb5294ce-6ffe-46c9-adfd-bba12818b5cb.jpg";
            travelPlan = await travelPlansService.create(data);
        } catch (error) {
            return next(new InternalException(`An error occurred creating travel plan for user ${user.id}`, error));
        }

        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/generate", validateInput(schemas.postGenerateTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { externalId } = req.state.user;
        const { planId } = req.state.input.params;

        let travelPlan = null;
        let user = null;
        try {
            [travelPlan, user] = await Promise.all([travelPlansService.findById(planId), userService.findByExternalId(externalId)]);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plan ${planId}`, error));
        }

        if (!travelPlan)
            return next(new NotFoundException(`An error occurred finding travel plan ${planId}`));

        if (!user) return next(new NotFoundException(`An error occurred finding user ${externalId}`));

        if (!user.birthday || !user.disabilities || !user.restaurantDietTags)
            return next(new InternalException(`User with id ${externalId} has invalid properties`));

        try {
            // This value means 1 / (365 * 24 * 60 * 60 * 1000)
            const age = Math.round((new Date() - user.birthday.toDate()) * 3.1709791983764586e-11);
            const tripDays = travelPlan.travelDuration;
            const attractions = travelPlan.tourismTypes.join(", ");
            const schedule = convertPreferredTimeToText(travelPlan.preferredTime);

            const disabilities = user.disabilities.join(", ");
            const dietRestrictions = user.restaurantDietTags.join(", ");

            const arrivalTime = travelPlan.arrivalHour;
            const departureTime = travelPlan.departureHour;

            const numberText = travelPlan.travelerCount === 1 ? "a solo" : `${travelPlan.travelerCount} persons`;

            const hasDisabilities = disabilities.length > 0;
            const hasDietRestrictions = dietRestrictions.length > 0;
            const disabilitiesText = hasDisabilities ? `the following disabilities: ${disabilities}` : "";
            const dietText = hasDietRestrictions ? `the following diet restrictions: ${dietRestrictions}` : "";
            const hasAndInText = !hasDietRestrictions || !hasDisabilities ? "" : " and ";
            const considerations = hasDisabilities || hasDietRestrictions ? ` Please consider that i have ${disabilitiesText}${hasAndInText}${dietText}.` : "";

            const prompt = `I'm ${age} years old and planning a ${tripDays}-day trip with ${numberText} to Rome. I am interested in: ${attractions} and culinary experiences. My schedule is from ${schedule}. Could you please create a travel plan with tourist attractions and restaurants with suggested times for every visit. Consider that i will arrive at ${formatHour(arrivalTime)} on day 1 and departure will be at ${formatHour(departureTime)} on last day;${considerations}`;
            logger.debug(`Created prompt: ${prompt}`);
            const plan = await aiService.generateResponse(prompt);

            travelPlan.plan = plan;
            logger.debug(`Generated plan: ${JSON.stringify(plan)}`);
            travelPlan.prompt = prompt;
        } catch (error) {
            return next(new InternalException(`An error occurred generating travel plan for user ${user.id}`, error));
        }

        try {
            const dbPlaces = await Promise.all(travelPlan.plan.places.map(
                (place) => placesService.searchOne(place.originalName.split(" ")[0].toLowerCase())
            ));

            const tagQuestionOperations = dbPlaces.reduce((list, place) => {
                if (place && !list.includes(place.types[0])) {
                    list.push(place.types[0]);
                }

                return list;
            }, ["tourist_attraction", "restaurant"]).map((tag) => questionService.findQuestions("tag", tag));
            const foodQuestionOperations = ["wine", "beer", "breakfast"].map((tag) => questionService.findQuestions("food", tag));

            const [[placeQuestions], [foodQuestions]] = await Promise.all([Promise.all(tagQuestionOperations), Promise.all(foodQuestionOperations)]);

            for (let index = 0; index < travelPlan.plan.places.length; index++) {
                const place = travelPlan.plan.places[index];
                const dbPlace = dbPlaces[index];

                if (place.placeType === "HOTEL") continue;

                place.questions = [];
                const isRestaurant = place.placeType === "RESTAURANT";
                if (isRestaurant) place.questions = place.questions.concat(placeQuestions[1].questions);
                else place.questions = place.questions.concat(placeQuestions[0].questions);

                if (!dbPlace) continue;

                if (isRestaurant) {
                    if (dbPlace.servesWine) place.questions = place.questions.concat(foodQuestions[0].questions);
                    if (dbPlace.servesBeer) place.questions = place.questions.concat(foodQuestions[1].questions);
                    if (dbPlace.servesBreakfast) place.questions = place.questions.concat(foodQuestions[2].questions);
                }

                const tag = dbPlace.types[0];
                const tagQuestions = placeQuestions.find((question) => question.subtype === tag);

                if (!tagQuestions) continue;

                place.questions = place.questions.concat(tagQuestions.questions);
            }

            travelPlan.plan = {
                tips: travelPlan.plan.tips,
                days: travelPlan.plan.places.reduce((list, place, index) => {
                    const lastIndex = list.length;
                    if (place.day > lastIndex) list.push({ schedule: [], restaurants: [] });

                    const mountedPlace = {
                        name: place.originalName,
                        translatedName: place.translatedName,
                        time: place.time,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        reference: dbPlaces[index] || {},
                        questions: place.questions
                    };
                    if (place.isRestaurant) list[place.day - 1].restaurants.push(mountedPlace);
                    else list[place.day - 1].schedule.push(mountedPlace);

                    return list;
                }, [])
            };

            await travelPlansService.update(planId, travelPlan);
        } catch (error) {
            return next(new InternalException(`An error occurred generating travel plan for user ${user.id}`, error));
        }

        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/start", validateInput(schemas.postStartTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { planId } = req.state.input.params;

        let travelPlan = null;

        try {
            travelPlan = await travelPlansService.findById(planId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plan ${planId}`, error));
        }

        if (!travelPlan || !travelPlan.plan)
            return next(new NotFoundException(`An error occurred finding travel plan ${planId}`));

        try {
            travelPlan.startDate = new Date();
            travelPlan = await travelPlansService.update(planId, travelPlan);
        } catch (error) {
            return next(new InternalException(`An error occurred updating plan ${planId}`, error));
        }

        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/finish", validateInput(schemas.postFinishTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { planId } = req.state.input.params;

        let travelPlan = null;

        try {
            travelPlan = await travelPlansService.findById(planId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plan ${planId}`, error));
        }

        if (!travelPlan || travelPlan.startDate == null)
            return next(new NotFoundException(`An error occurred finding travel plan ${planId}`));

        try {
            travelPlan.endDate = new Date();
            travelPlan = await travelPlansService.update(planId, travelPlan);
        } catch (error) {
            return next(new InternalException(`An error occurred updating plan ${planId}`, error));
        }

        return res.json(travelPlan);
    });
}

module.exports = {
    configureTravelPlansRoutes
};
