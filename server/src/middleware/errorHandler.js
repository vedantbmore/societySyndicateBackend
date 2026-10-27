const env = require("../config/env");
const { ApiError } = require("../utils/ApiError");

function notFound(req, _res, next) {
  next(new ApiError(404, `No route: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "Internal server error.";
  let details = err.details;

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid identifier: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    message = `A record with this ${field} already exists.`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed.";
    details = Object.values(err.errors).map((e) => e.message);
  }

  if (statusCode >= 500) {
    console.error("[error]", err);
    if (env.NODE_ENV === "production") message = "Internal server error.";
  }

  res.status(statusCode).json({
    error: { message, details },
  });
}

module.exports = { notFound, errorHandler };
