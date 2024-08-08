const { BadRequestException } = require("../models/errors");

function isValidObject(value) {
    return typeof value === "object" && Object.keys(value).length > 0;
}

function validateInput(schema) {
    return async function (request, _, next) {
        const input = {
            headers: request.headers,
        };

        if (isValidObject(request.body)) input.body = request.body;
        if (isValidObject(request.params)) input.params = request.params;
        if (isValidObject(request.query)) input.query = request.query;

        try {
            const result = await schema.validateAsync(input);

            request.state.input = result;
            next();
        } catch (error) {
            next(new BadRequestException("Invalid request input", error, error.details));
        }
    }
};

module.exports = {
    validateInput
};
