const { getAuth } = require("firebase-admin/auth");
const { UnauthorizedException } = require("../models/errors");

class Auth {
    authenticate() {
        return async (req, _, next) => {
            let token = req.state.input.headers["authorization"].split(" ")[1];
            if (!token) token = req.state.input.query.token;

            try {
                const userInfo = await getAuth().verifyIdToken(token);
                const result = userInfo.uid;
                if (!result) throw new Error("Unauthorized error");

                req.state.user = { externalId: result };
                next();
            } catch (error) {
                next(new UnauthorizedException("Request unauthorized", error));
            }
        };
    }
}

module.exports = {
    Auth,
};
