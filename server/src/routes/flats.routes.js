const { Router } = require("express");
const ctrl = require("../controllers/flats.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.use(requireAuth);
router.get("/", ctrl.listFlats);
router.get("/:id", ctrl.getFlat);

module.exports = router;
