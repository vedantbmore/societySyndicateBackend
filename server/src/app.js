const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");

const env = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiters");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // needed for correct client IPs / rate limiting behind a reverse proxy

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: false,
  })
);
app.use(compression());
// Raised from the default to accommodate base64 profile/visitor photo
// uploads (client-side resized to a few hundred KB before sending).
app.use(express.json({ limit: "4mb" }));
app.use(mongoSanitize());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
