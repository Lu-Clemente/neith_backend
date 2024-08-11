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
/* eslint-enable no-unused-vars */

/**
 * @param {Express.Application} app 
 * @param {TravelPlansService} travelPlansService
 * @param {AIService} aiService 
 * @param {UsersService} userService 
 * @param {PlacesService} placesService 
 * @param {StorageService} storageService 
 * @param {Auth} authMiddleware 
 */
function configureTravelPlansRoutes(app, travelPlansService, aiService, userService, placesService, storageService, authMiddleware) {
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

            const disabilities = user.disabilities.join(", ");
            const dietRestrictions = user.restaurantDietTags.join(", ");

            const arrivalTime = travelPlan.arrivalHour;
            const departureTime = travelPlan.departureHour;

            const numberText = travelPlan.travelerCount === 1 ? "a solo" : travelPlan.travelerCount.toString();
            const promptBase = `I'm ${age} years old and planning a ${tripDays}-day and ${numberText} trip to Rome`;

            const hasDisabilities = disabilities.length > 0;
            const hasDietRestrictions = dietRestrictions.length > 0;
            const disabilitiesText = hasDisabilities ? `the following disabilities: ${disabilities}` : "";
            const dietText = hasDietRestrictions ? `the following diet restrictions: ${dietRestrictions}` : "";
            const hasAndInText = !hasDietRestrictions || !hasDisabilities ? "" : " and ";
            const considerations = hasDisabilities || hasDietRestrictions ? ` Please consider that i have ${disabilitiesText}${hasAndInText}${dietText}.` : "";

            const result = await aiService.generateResponse(`${promptBase}. I'm interested in: ${attractions}. I prefer doing things by ${preferredTime}. Could you please create a travel plan with suggested times and tourist attractions for my trip, also suggest me the places I could have lunch and dinner in the meantime? Respond with a json string); Consider that i will arrive at ${arrivalTime} on day 1 and departure at ${departureTime} on last day.${considerations}`);
            travelPlan.plan = JSON.parse(result);
            travelPlan = await travelPlansService.update(planId, travelPlan);
        } catch (error) {
            return next(new InternalException(`An error occurred generating travel plan for user ${user.id}`, error));
        }

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
