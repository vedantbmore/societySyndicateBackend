const { Router } = require("express");
const ctrl = require("../controllers/entries.controller");
const { requireAuth, requireRole, loadGuardProfile, loadResidentProfile } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { verifyTokenSchema } = require("../validators/entries.schema");
const { verifyLimiter } = require("../middleware/rateLimiters");

const router = Router();

router.use(requireAuth);

router.get("/inside", requireRole("admin", "guard"), ctrl.listCurrentlyInside);
router.get("/history", requireRole("admin", "guard"), ctrl.listHistory);
router.get(
  "/history/flat/:flatId",
  requireRole("admin", "resident"),
  (req, res, next) => (req.user.role === "resident" ? loadResidentProfile(req, res, next) : next()),
  ctrl.listHistoryForFlat
);
router.post(
  "/verify",
  requireRole("guard"),
  loadGuardProfile,
  verifyLimiter,
  validate(verifyTokenSchema),
  ctrl.verifyToken
);
router.patch("/:id/exit", requireRole("guard"), loadGuardProfile, ctrl.recordExit);

module.exports = router;
