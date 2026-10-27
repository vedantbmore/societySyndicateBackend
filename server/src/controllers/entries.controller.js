const VisitorInvitation = require("../models/VisitorInvitation");
const VisitorEntry = require("../models/VisitorEntry");
const Flat = require("../models/Flat");
const Guard = require("../models/Guard");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { raiseAlert } = require("../services/alerts.service");
const { runSecurityChecks } = require("../services/security.service");
const { reconcileExpiredInvitations } = require("../services/expiry.service");

const REASONS = {
  not_found: "This QR code or pass code was not recognized.",
  used: "This pass has already been used to enter.",
  cancelled: "This invitation was cancelled by the resident.",
  rejected: "This invitation is not valid for entry.",
  expired: "This pass has expired.",
};

async function attachEntryMany(entries) {
  const flatIds = [...new Set(entries.map((e) => e.flatId.toString()))];
  const guardIds = [
    ...new Set(entries.flatMap((e) => [e.entryGuardId?.toString(), e.exitGuardId?.toString()].filter(Boolean))),
  ];
  const [flats, guards] = await Promise.all([
    Flat.find({ _id: { $in: flatIds } }),
    Guard.find({ _id: { $in: guardIds } }),
  ]);
  const flatById = new Map(flats.map((f) => [f.id, f]));
  const guardById = new Map(guards.map((g) => [g.id, g]));

  return entries.map((entry) => {
    const flat = flatById.get(entry.flatId.toString());
    const entryGuard = guardById.get(entry.entryGuardId?.toString());
    const exitGuard = entry.exitGuardId ? guardById.get(entry.exitGuardId.toString()) : undefined;
    return {
      ...entry.toJSON(),
      flatNumber: flat?.number ?? "-",
      building: flat?.building ?? "-",
      entryGuardName: entryGuard?.name ?? "-",
      exitGuardName: exitGuard?.name,
    };
  });
}

const listCurrentlyInside = asyncHandler(async (_req, res) => {
  const entries = await VisitorEntry.find({ exitTime: null }).sort({ entryTime: -1 });
  res.json(await attachEntryMany(entries));
});

const listHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const entries = await VisitorEntry.find().sort({ entryTime: -1 }).limit(limit);
  res.json(await attachEntryMany(entries));
});

const listHistoryForFlat = asyncHandler(async (req, res) => {
  if (req.user.role === "resident" && req.residentProfile.flatId.toString() !== req.params.flatId) {
    throw ApiError.forbidden("You can only view history for your own flat.");
  }
  const entries = await VisitorEntry.find({ flatId: req.params.flatId }).sort({ entryTime: -1 });
  res.json(await attachEntryMany(entries));
});

const recordExit = asyncHandler(async (req, res) => {
  const entry = await VisitorEntry.findById(req.params.id);
  if (!entry) throw ApiError.notFound("Entry not found.");
  if (entry.exitTime) throw ApiError.badRequest("This visitor has already exited.");

  entry.exitTime = new Date();
  entry.exitGuardId = req.guardProfile.id;
  await entry.save();
  res.json(entry);
});

const verifyToken = asyncHandler(async (req, res) => {
  await reconcileExpiredInvitations();
  const { token, method } = req.body;
  const guardId = req.guardProfile.id;

  const invitation = await VisitorInvitation.findOne({ qrToken: token });

  if (!invitation) {
    await raiseAlert({
      type: "repeated_failure",
      severity: "low",
      title: "Unrecognized Pass Scanned",
      description: "A guard scanned or entered a code that did not match any invitation.",
      recommendation: "Ask the visitor to confirm the pass with the resident, or use manual verification.",
    });
    return res.json({ ok: false, reason: REASONS.not_found });
  }

  if (invitation.status === "used") return res.json({ ok: false, reason: REASONS.used, invitation });
  if (invitation.status === "cancelled") return res.json({ ok: false, reason: REASONS.cancelled, invitation });
  if (invitation.status === "rejected") return res.json({ ok: false, reason: REASONS.rejected, invitation });

  if (invitation.status === "expired" || invitation.validUntil.getTime() < Date.now()) {
    if (invitation.status !== "expired") {
      invitation.status = "expired";
      await invitation.save();
    }
    await raiseAlert({
      type: "expired_token",
      severity: "low",
      title: "Expired Pass Scan Attempt",
      description: `A guard attempted to verify an expired pass for "${invitation.visitor.name}".`,
      recommendation: "Ask the visitor to request a new invitation from the resident.",
      relatedInvitationId: invitation.id,
    });
    return res.json({ ok: false, reason: REASONS.expired, invitation });
  }

  // Success — record entry.
  invitation.status = "used";
  await invitation.save();

  const entry = await VisitorEntry.create({
    invitationId: invitation.id,
    visitorName: invitation.visitor.name,
    visitorType: invitation.visitor.type,
    flatId: invitation.hostFlatId,
    entryGuardId: guardId,
    entryTime: new Date(),
    entryMethod: method,
  });

  await runSecurityChecks(invitation, entry);

  res.json({ ok: true, invitation });
});

module.exports = { listCurrentlyInside, listHistory, listHistoryForFlat, recordExit, verifyToken };
