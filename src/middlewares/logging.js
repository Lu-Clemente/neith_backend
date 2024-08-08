const { v4: uuidV4 } = require("uuid");

function inLog(logger) {
  return (req, _, next) => {
    const tid = uuidV4();

    logger.log({
      message: "Executing request",
      hostname: req.hostname,
      url: req.url,
      method: req.method,
      tid,
    });

    if (!req.state) req.state = {};
    req.state.tid = tid;

    next();
  };
}

function outLog(logger) {
  return (req, res, next) => {
    logger.log({
      message: "Request executed",
      hostname: req.hostname,
      url: req.url,
      method: req.method,
      result: res.body,
      tid: req.state.tid,
    });

    next();
  };
}

function errorLog(logger) {
  return (error, req, _, next) => {
    logger.error({
      message: error.message,
      hostname: req.hostname,
      url: req.url,
      method: req.method,
      error: error.log(),
      status: error.status,
      tid: req.state.tid,
    });

    next(error);
  };
}

module.exports = {
  inLog,
  outLog,
  errorLog,
};
