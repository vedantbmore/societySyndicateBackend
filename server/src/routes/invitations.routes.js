const { Router } = require("express");
const ctrl = require("../controllers/invitations.controller");
const { requireAuth, requireRole, loadResidentProfile } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createInvitationSchema } = require("../validators/invitations.schema");

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("admin"), ctrl.listAllInvitations);
router.get("/mine", requireRole("resident"), loadResidentProfile, ctrl.listMyInvitations);
router.post(
  "/",
  requireRole("resident"),
  loadResidentProfile,
  validate(createInvitationSchema),
  ctrl.createInvitation
);
router.get("/token/:token", requireRole("admin", "guard"), ctrl.getInvitationByToken);
router.get("/:id", requireRole("admin", "resident"), loadResidentProfileIfResident, ctrl.getInvitationById);
router.patch(
  "/:id/cancel",
  requireRole("admin", "resident"),
  loadResidentProfileIfResident,
  ctrl.cancelInvitation
);

// Only residents need their profile loaded for ownership checks; admins skip it.
function loadResidentProfileIfResident(req, res, next) {
  if (req.user.role !== "resident") return next();
  return loadResidentProfile(req, res, next);
}

module.exports = router;
