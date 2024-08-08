function errorHandleMiddleware() {
    return (error, _, res, __) => {
        const status = error.status;

        const isBadRequest = status === 400;
        const result = isBadRequest ? error.data : "";
        if (isBadRequest) {
            res.status(status).json(result);
        } else {
            res.status(status).send(result);
        }
    };
}

module.exports = { 
    errorHandleMiddleware 
};
