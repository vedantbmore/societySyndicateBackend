const { ApiError } = require("../utils/ApiError");

// Validates req[part] (default "body") against a Zod schema, replacing it
// with the parsed (and coerced/defaulted) value on success.
function validate(schema, part = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return next(ApiError.badRequest("Invalid request data.", details));
    }
    req[part] = result.data;
    next();
  };
}

module.exports = { validate };
