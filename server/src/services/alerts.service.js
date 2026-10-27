const SecurityAlert = require("../models/SecurityAlert");

async function raiseAlert({ type, severity, title, description, recommendation, relatedInvitationId }) {
  return SecurityAlert.create({
    type,
    severity,
    title,
    description,
    recommendation,
    relatedInvitationId,
    status: "open",
  });
}

module.exports = { raiseAlert };
