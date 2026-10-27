const { Router } = require("express");
const ctrl = require("../controllers/alerts.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();

router.use(requireAuth, requireRole("admin", "guard"));
router.get("/", ctrl.listAlerts);
router.patch("/:id/resolve", requireRole("admin"), ctrl.resolveAlert);

module.exports = router;
