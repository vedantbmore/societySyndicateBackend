const { Router } = require("express");
const ctrl = require("../controllers/analytics.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/dashboard", ctrl.getDashboardStats);
router.get("/visitors-by-day", ctrl.getVisitorsByDay);
router.get("/visitors-by-type", ctrl.getVisitorsByType);

module.exports = router;
