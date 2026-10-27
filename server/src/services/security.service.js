const VisitorInvitation = require("../models/VisitorInvitation");
const Flat = require("../models/Flat");
const { raiseAlert } = require("./alerts.service");

// Ported 1:1 from the original frontend mock logic in src/api/qr.ts.
async function runSecurityChecks(invitation, entry) {
  const entryHour = entry.entryTime.getHours();
  if (entryHour < 6 || entryHour >= 23) {
    const flat = await Flat.findById(invitation.hostFlatId);
    await raiseAlert({
      type: "unusual_hour",
      severity: "medium",
      title: "Unusual Visit Time",
      description: `Visitor "${invitation.visitor.name}" entered at an unusual hour for flat ${flat?.number ?? "?"}.`,
      recommendation: "Manual verification recommended for late-night or early-morning entries.",
      relatedInvitationId: invitation._id,
    });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const overlapping = await VisitorInvitation.find({
    "visitor.phone": invitation.visitor.phone,
    hostFlatId: { $ne: invitation.hostFlatId },
    createdAt: { $gt: sevenDaysAgo },
  }).select("hostFlatId");

  const otherFlats = new Set(overlapping.map((i) => i.hostFlatId.toString()));
  if (otherFlats.size > 0) {
    const flat = await Flat.findById(invitation.hostFlatId);
    await raiseAlert({
      type: "multi_flat_visitor",
      severity: "medium",
      title: "Visitor Requested by Multiple Flats",
      description: `"${invitation.visitor.name}" was invited by flat ${flat?.number ?? "?"} and ${otherFlats.size} other flat(s) within the last 7 days.`,
      recommendation: "Confirm the visitor's purpose before granting entry.",
      relatedInvitationId: invitation._id,
    });
  }
}

module.exports = { runSecurityChecks };
