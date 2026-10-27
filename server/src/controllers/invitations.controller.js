const VisitorInvitation = require("../models/VisitorInvitation");
const Flat = require("../models/Flat");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { makeQrToken } = require("../utils/tokens");
const { reconcileExpiredInvitations } = require("../services/expiry.service");

async function attachFlat(invitation) {
  const flat = await Flat.findById(invitation.hostFlatId);
  return {
    ...invitation.toJSON(),
    flatNumber: flat?.number ?? "-",
    building: flat?.building ?? "-",
  };
}

async function attachFlatMany(invitations) {
  const flats = await Flat.find({ _id: { $in: invitations.map((i) => i.hostFlatId) } });
  const flatById = new Map(flats.map((f) => [f.id, f]));
  return invitations.map((inv) => {
    const flat = flatById.get(inv.hostFlatId.toString());
    return { ...inv.toJSON(), flatNumber: flat?.number ?? "-", building: flat?.building ?? "-" };
  });
}

const listAllInvitations = asyncHandler(async (_req, res) => {
  await reconcileExpiredInvitations();
  const invitations = await VisitorInvitation.find().sort({ createdAt: -1 });
  res.json(await attachFlatMany(invitations));
});

const listMyInvitations = asyncHandler(async (req, res) => {
  await reconcileExpiredInvitations();
  const invitations = await VisitorInvitation.find({ hostResidentId: req.residentProfile.id }).sort({
    createdAt: -1,
  });
  res.json(await attachFlatMany(invitations));
});

const createInvitation = asyncHandler(async (req, res) => {
  const resident = req.residentProfile;
  const { visitorName, visitorPhone, visitorType, photoUrl, purpose, expectedArrival, validHours } =
    req.body;

  const expectedArrivalDate = new Date(expectedArrival);
  const validUntil = new Date(expectedArrivalDate.getTime() + validHours * 3600_000);

  const invitation = await VisitorInvitation.create({
    visitor: { name: visitorName, phone: visitorPhone, type: visitorType, photoUrl },
    hostFlatId: resident.flatId,
    hostResidentId: resident.id,
    purpose,
    expectedArrival: expectedArrivalDate,
    validUntil,
    status: "approved",
    qrToken: makeQrToken(),
  });

  res.status(201).json(invitation);
});

const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await VisitorInvitation.findById(req.params.id);
  if (!invitation) throw ApiError.notFound("Invitation not found.");

  if (req.user.role === "resident" && invitation.hostResidentId.toString() !== req.residentProfile.id) {
    throw ApiError.forbidden("You can only cancel your own invitations.");
  }
  if (invitation.status === "used") {
    throw ApiError.badRequest("Cannot cancel a pass that has already been used.");
  }

  invitation.status = "cancelled";
  await invitation.save();
  res.json(invitation);
});

const getInvitationById = asyncHandler(async (req, res) => {
  const invitation = await VisitorInvitation.findById(req.params.id);
  if (!invitation) return res.json(null);

  if (req.user.role === "resident" && invitation.hostResidentId.toString() !== req.residentProfile.id) {
    throw ApiError.forbidden("You can only view your own invitations.");
  }

  res.json(await attachFlat(invitation));
});

const getInvitationByToken = asyncHandler(async (req, res) => {
  const invitation = await VisitorInvitation.findOne({ qrToken: req.params.token });
  res.json(invitation ?? null);
});

module.exports = {
  listAllInvitations,
  listMyInvitations,
  createInvitation,
  cancelInvitation,
  getInvitationById,
  getInvitationByToken,
};
