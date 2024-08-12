const schemas = require("./schemas");

const { validateInput } = require("../../middlewares/input-validation");
const { NotFoundException, InternalException } = require("../../models/errors");
const { TravelPlan } = require("../../models/travelPlan");
const { User } = require("../../models/user");

/* eslint-disable no-unused-vars */
const { TravelPlansService } = require("../../services/travel-plans.service");
const { AIService } = require("../../services/ai.service");
const { UsersService } = require("../../services/users.service");
const { Auth } = require("../../middlewares/auth.middleware");
const { PlacesService } = require("../../services/places.service");
const { StorageService } = require("../../services/storage.service");
const { QuestionsService } = require("../../services/questions.service");
/* eslint-enable no-unused-vars */

/**
 * @param {Express.Application} app 
 * @param {TravelPlansService} travelPlansService
 * @param {AIService} aiService 
 * @param {UsersService} userService 
 * @param {PlacesService} placesService 
 * @param {StorageService} storageService 
 * @param {QuestionsService} questionService 
 * @param {Auth} authMiddleware 
 */
function configureTravelPlansRoutes(app, travelPlansService, aiService, userService, placesService, storageService, questionService, authMiddleware) {
    app.get("/v1/travel-plans/:userId", validateInput(schemas.getTravelPlans), authMiddleware.authenticate(), async (req, res, next) => {
        const { userId } = req.state.input.params;

        let travelPlans = null;
        try {
            travelPlans = await travelPlansService.listForUserId(userId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plans for user ${userId}`, error));
        }

        return res.json(travelPlans);
    });

    app.get("/v1/places", validateInput(schemas.getPlaces), authMiddleware.authenticate(), async (req, res, next) => {
        const { offset, limit, text } = req.state.input.query;

        let places = [];
        try {
            places = await placesService.searchPaginated(offset, limit, text);

            const photos = await Promise.all(places.map((place) => storageService.getDownloadURL(place.photoPath)));
            places = places.map((place, index) => {
                place.photoUrl = photos[index];
                return place;
            });
        } catch (error) {
            return next(new InternalException("An error occurred finding places", error));
        }

        return res.json(places);
    });

    app.post("/v1/travel-plans/:userId", validateInput(schemas.postTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { userId } = req.state.input.params;
        const data = req.state.input.body;

        let travelPlan = null;
        try {
            data.userId = userId;
            travelPlan = await travelPlansService.create(data);
        } catch (error) {
            return next(new InternalException(`An error occurred creating travel plan for user ${userId}`, error));
        }

        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/generate", validateInput(schemas.postGenerateTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { externalId } = req.state.user;
        const { planId } = req.state.input.params;

        let travelPlan = new TravelPlan();
        let user = new User();
        try {
            [travelPlan, user] = await Promise.all([travelPlansService.findById(planId), userService.findByExternalId(externalId)]);
        } catch (error) {
            return next(new InternalException(`An error occurred finding travel plan ${planId}`, error));
        }

        if (!travelPlan)
            return next(new NotFoundException(`An error occurred finding travel plan ${planId}`));

        if (!user)
            return next(new NotFoundException(`An error occurred finding user ${externalId}`));

        try {
            const age = Math.round((new Date() - user.birthday.getFullYear()) * 3.1709791983764586e-11);
            const tripDays = travelPlan.travelDuration;
            const attractions = travelPlan.tourismTypes.join(", ");
            const preferredTime = travelPlan.preferredTime;
            const schedule = preferredTime === "morning" ? "7AM to 11AM" : preferredTime === "afternoon" ? "12PM to 5PM" : "6PM to 11PM";

            const disabilities = user.disabilities.join(", ");
            const dietRestrictions = user.restaurantDietTags.join(", ");

            const arrivalTime = travelPlan.arrivalHour;
            const departureTime = travelPlan.departureHour;

            const numberText = travelPlan.travelerCount === 1 ? "a solo" : travelPlan.travelerCount.toString();

            const hasDisabilities = disabilities.length > 0;
            const hasDietRestrictions = dietRestrictions.length > 0;
            const disabilitiesText = hasDisabilities ? `the following disabilities: ${disabilities}` : "";
            const dietText = hasDietRestrictions ? `the following diet restrictions: ${dietRestrictions}` : "";
            const hasAndInText = !hasDietRestrictions || !hasDisabilities ? "" : " and ";
            const considerations = hasDisabilities || hasDietRestrictions ? ` Please consider that i have ${disabilitiesText}${hasAndInText}${dietText}.` : "";

            const plan = await aiService.generateResponse(`I'm ${age} years old and planning a ${tripDays}-day and ${numberText} trip to Rome. I have interest in: ${attractions} and culinary experiences. My schedule is from ${schedule}. Could you please create a travel plan and tourist attractions, and restaurants with suggested times for every visit. Consider that i will arrive at ${arrivalTime} on day 1 and departure at ${departureTime} on last day;${considerations} Respond with a json string`);
            travelPlan.plan = JSON.parse(plan);
        } catch (error) {
            return next(new InternalException(`An error occurred generating travel plan for user ${user.id}`, error));
        }

        try {
            const restaurantOp = [];
            const locationOp = [];

            const searchPlaces = (list, nameKey) => {
                const operations = [];

                for (let index = 0; index < list.length; index++) {
                    const name = list[index][nameKey];
                    operations.push(placesService.searchPaginated(0, 1, name.toLowerCase()));
                }

                return operations;
            }

            for (let index = 0; index < travelPlan.plan.days.length; index++) {
                const day = travelPlan.plan.days[index];
                const { restaurants, schedule } = day;
                
                restaurantOp.push(...searchPlaces(restaurants, "name"));
                locationOp.push(...searchPlaces(schedule, "location"));
            }

            const [
                restaurantResults,
                locationResults,
                locationDefaultQuestions,
                restaurantDefaultQuestions
            ] = await Promise.all([
                Promise.all(locationOp),
                Promise.all(restaurantOp),
                questionService.findQuestions("tag", "tourist_attraction"),
                questionService.findQuestions("tag", "restaurant"),
            ]);

            const locationQuestions = locationResults.map((location) => {
                if (location.length === 0 || location[0].types.length === 0)
                    return locationDefaultQuestions;

                return questionService.findQuestions("tag", location[0].types[0]);
            });
            const restaurantQuestions = restaurantResults.map((restaurant) => {
                if (restaurant.length === 0)
                    return restaurantDefaultQuestions;

                return new Promise((resolve, reject) => {
                    const ops = [restaurantDefaultQuestions];
                    const place = restaurant[0];
                    if (place.servesWine) ops.push(questionService.findQuestions("food", "wine"));
                    if (place.servesBeer) ops.push(questionService.findQuestions("food", "beer"));
                    if (place.servesBreakfast) ops.push(questionService.findQuestions("food", "breakfast"));

                    Promise.all(ops).then((result) => resolve(result.flat(1))).catch((error) => reject(error));
                });
            });

            for (let index = 0; index < locationQuestions.length; index++) {
                const questions = locationQuestions[index];

                let operations = 0;
                for (let i = 0; i < travelPlan.plan.days.length; i++) {
                    const day = travelPlan.plan.days[i];
                    if (operations + day.schedule.length < index) {
                        operations += day.schedule.length;
                        continue;
                    }
                    for (let j = 0; j < day.schedule.length; j++) {
                        const scheduleIndex = index - operations;
                        if (scheduleIndex != j) continue;

                        travelPlan.plan.days[i].day.schedule[j].questions = questions;
                        break;
                    }
                    break;
                }
            }

            for (let index = 0; index < restaurantQuestions.length; index++) {
                const questions = restaurantQuestions[index];

                let operations = 0;
                for (let i = 0; i < travelPlan.plan.days.length; i++) {
                    const day = travelPlan.plan.days[i];
                    if (operations + day.restaurants.length < index) {
                        operations += day.restaurants.length;
                        continue;
                    }
                    for (let j = 0; j < day.restaurants.length; j++) {
                        const restaurantIndex = index - operations;
                        if (restaurantIndex != j) continue;

                        travelPlan.plan.days[i].day.restaurants[j].questions = questions;
                        break;
                    }
                    break;
                }
            }
        } catch (error) {
            return next(new InternalException(`An error occurred generating travel plan for user ${user.id}`, error));
        }

        travelPlan = await travelPlansService.update(planId, travelPlan);
        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/start", validateInput(schemas.postStartTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { planId } = req.state.input.params;
        const data = req.state.input.body;

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
            travelPlan = await travelPlansService.update(data);
        } catch (error) {
            return next(new InternalException(`An error occurred updating plan ${planId}`, error));
        }

        return res.json(travelPlan);
    });

    app.post("/v1/travel-plans/:planId/finish", validateInput(schemas.postFinishTravelPlan), authMiddleware.authenticate(), async (req, res, next) => {
        const { planId } = req.state.input.params;
        const data = req.state.input.body;

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
            travelPlan = await travelPlansService.update(data);
        } catch (error) {
            return next(new InternalException(`An error occurred updating plan ${planId}`, error));
        }

        return res.json(travelPlan);
    });
}

module.exports = {
    configureTravelPlansRoutes
};
