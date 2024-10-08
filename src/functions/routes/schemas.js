const Joi = require("joi");

const baseSchemas = {
    authorizationSchema: {
        authorization: Joi.string().regex(/Bearer .+/).required(),
    },
};

const schemas = {
    postLogin: Joi.object().keys({
        headers: Joi.object().unknown(),
        body: Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
        }),
    }).required(),
    postRegister: Joi.object().keys({
        headers: Joi.object().unknown(),
        body: Joi.object().keys({
            name: Joi.string().regex(/(\w+\s?)+/).required(),
            birthday: Joi.date().required(),
            externalId: Joi.string().required(),
        }),
    }).required(),
    postForgotPassword: Joi.object().keys({
        headers: Joi.object().unknown(),
        params: Joi.object().keys({
            email: Joi.string().email().required(),
        }),
    }).required(),
    putUser: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        body: Joi.object().keys({
            name: Joi.string().regex(/(\w+\s?)+/),
            birthday: Joi.date(),
            disabilities: Joi.array().items(Joi.string()),
            restaurantDietTags: Joi.array().items(Joi.string()),
        }).required(),
    }).required(),
    getTravelPlans: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required()
    }).required(),
    getPlaces: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        query: Joi.object().keys({
            offset: Joi.number().integer().min(0).default(0).optional(),
            limit: Joi.number().integer().min(0).default(20).optional(),
            text: Joi.string().empty("").default(""),
        }).default({ start: 0, length: 20, text: "" }),
    }).required(),
    postTravelPlan: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        body: Joi.object().keys({
            preferredTime: Joi.array()
                .items(
                    Joi.string().allow("morning", "afternoon", "night")
                ).required(),
            tourismTypes: Joi.array().items(Joi.string()).min(1).required(),
            travelerCount: Joi.number().positive().required(),
            travelDuration: Joi.number().positive().required(),
            arrivalHour: Joi.number().integer().min(0).max(23),
            departureHour: Joi.number().integer().min(0).max(23),
            name: Joi.string().min(4).max(24).required()
        }).required(),
    }).required(),
    postGenerateTravelPlan: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        params: Joi.object().keys({
            planId: Joi.string().uuid().required()
        }).required()
    }).required(),
    postStartTravelPlan: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        params: Joi.object().keys({
            planId: Joi.string().uuid().required()
        }).required()
    }).required(),
    postFinishTravelPlan: Joi.object().keys({
        headers: Joi.object(baseSchemas.authorizationSchema)
            .unknown()
            .required(),
        params: Joi.object().keys({
            planId: Joi.string().uuid().required()
        }).required()
    }).required(),
};

module.exports = schemas;
