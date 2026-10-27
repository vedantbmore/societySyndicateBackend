const SecurityAlert = require("../models/SecurityAlert");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");

const listAlerts = asyncHandler(async (_req, res) => {
  const alerts = await SecurityAlert.find().sort({ createdAt: -1 });
  res.json(alerts);
});

const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await SecurityAlert.findById(req.params.id);
  if (!alert) throw ApiError.notFound("Alert not found.");
  alert.status = "resolved";
  await alert.save();
  res.json(alert);
});

module.exports = { listAlerts, resolveAlert };
