const schemas = require("./schemas");

const { validateInput } = require("../../middlewares/input-validation");

const { InternalException, NotFoundException } = require("../../models/errors");
const { putChangeValue, arrayEquals } = require("../../utils/update-functions");

/* eslint-disable no-unused-vars */
const { UserService } = require("../../services/user.service");
const { Auth } = require("../../middlewares/auth.middleware");
/* eslint-enable no-unused-vars */

/**
 * 
 * @param {Express.Application} app 
 * @param {UserService} userService 
 * @param {Auth} authMiddleware 
 */
function configureUserRoutes(app, userService, authMiddleware) {
    app.post("/v1/users/", validateInput(schemas.postRegister), async (req, res, next) => {
        const userInput = req.state.input.body;

        let user = null;
        try {
            user = await userService.create(userInput);
        } catch (error) {
            next(new InternalException("An error occurred creating user", error));
        }

        return res.json(user);
    });

    app.put("/v1/users/", validateInput(schemas.putUser), authMiddleware.authenticate(), async (req, res, next) => {
        const { externalId } = req.state.user;
        const userInput = req.state.input.body;

        let user = null;
        try {
            user = await userService.findByExternalId(externalId);
        } catch (error) {
            return next(new InternalException(`An error occurred finding user ${externalId}`, error));
        }

        if (!user) {
            return next(new NotFoundException(`User with id ${externalId}, was not found`));
        }

        const updatedUser = {
            name: putChangeValue(user.name, userInput.name),
            birthday: putChangeValue(user.birthday, userInput.birthday),
            disabilities: arrayEquals(user.disabilities, userInput.disabilities),
            restaurantDietTags: arrayEquals(user.restaurantDietTags, userInput.restaurantDietTags),
            externalId: user.externalId
        };
        try {
            user = await userService.update(user.id, updatedUser);
        } catch (error) {
            next(new InternalException("An error occurred creating user", error));
        }

        return res.json(updatedUser);
    });
}

module.exports = {
    configureUserRoutes
};
