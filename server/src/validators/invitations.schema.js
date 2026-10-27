const { z } = require("zod");
const { imageDataUrl } = require("./shared");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier.");

// hostFlatId/hostResidentId are accepted for backward compatibility with the
// existing frontend payload shape, but the server always derives the real
// values from the authenticated resident's own profile — see
// invitations.controller.js — so a resident can never invite on another
// flat's behalf.
const createInvitationSchema = z.object({
  hostFlatId: objectId.optional(),
  hostResidentId: objectId.optional(),
  visitorName: z.string().trim().min(1, "Visitor name is required.").max(120),
  visitorPhone: z.string().trim().min(6, "Enter a valid phone number.").max(20),
  visitorType: z.enum(["guest", "delivery", "cab", "service"]),
  photoUrl: imageDataUrl.optional(),
  purpose: z.string().trim().max(200).optional().default("Visitor"),
  expectedArrival: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date."),
  validHours: z.coerce.number().int().min(1).max(72),
});

module.exports = { createInvitationSchema };
