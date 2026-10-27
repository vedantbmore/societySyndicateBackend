const Guard = require("../models/Guard");
const { asyncHandler } = require("../utils/asyncHandler");

const listGuards = asyncHandler(async (_req, res) => {
  const guards = await Guard.find().sort({ name: 1 });
  res.json(guards);
});

const getMyGuardProfile = asyncHandler(async (req, res) => {
  res.json(req.guardProfile);
});

module.exports = { listGuards, getMyGuardProfile };
