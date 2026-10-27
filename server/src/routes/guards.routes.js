const { Router } = require("express");
const ctrl = require("../controllers/guards.controller");
const { requireAuth, requireRole, loadGuardProfile } = require("../middleware/auth");

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("admin"), ctrl.listGuards);
router.get("/me", requireRole("guard"), loadGuardProfile, ctrl.getMyGuardProfile);

module.exports = router;
