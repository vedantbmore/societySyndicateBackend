const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Resident = require("../models/Resident");
const Guard = require("../models/Guard");
const { verifyAuthToken } = require("../utils/tokens");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Missing or malformed Authorization header.");
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Session expired. Please sign in again.");
    }
    throw ApiError.unauthorized("Invalid session token.");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account no longer exists or is disabled.");
  }

  req.user = user;
  next();
});

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires role: ${roles.join(" or ")}.`));
    }
    next();
  };
}

// Loads the caller's Resident profile (role=resident) and attaches it as req.residentProfile.
const loadResidentProfile = asyncHandler(async (req, _res, next) => {
  const resident = await Resident.findOne({ userId: req.user.id });
  if (!resident) throw ApiError.notFound("No resident profile is linked to this account.");
  req.residentProfile = resident;
  next();
});

// Loads the caller's Guard profile (role=guard) and attaches it as req.guardProfile.
const loadGuardProfile = asyncHandler(async (req, _res, next) => {
  const guard = await Guard.findOne({ userId: req.user.id });
  if (!guard) throw ApiError.notFound("No guard profile is linked to this account.");
  req.guardProfile = guard;
  next();
});

module.exports = { requireAuth, requireRole, loadResidentProfile, loadGuardProfile };
