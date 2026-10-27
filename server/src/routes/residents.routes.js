const { Router } = require("express");
const ctrl = require("../controllers/residents.controller");
const { validate } = require("../middleware/validate");
const { createResidentSchema } = require("../validators/residents.schema");
const { requireAuth, requireRole, loadResidentProfile } = require("../middleware/auth");

const router = Router();

router.use(requireAuth);
router.get("/", requireRole("admin"), ctrl.listResidents);
router.get("/me", requireRole("resident"), loadResidentProfile, ctrl.getMyResidentProfile);
router.post("/", requireRole("admin"), validate(createResidentSchema), ctrl.createResident);

module.exports = router;
