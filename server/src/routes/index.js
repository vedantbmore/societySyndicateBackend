const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/flats", require("./flats.routes"));
router.use("/residents", require("./residents.routes"));
router.use("/guards", require("./guards.routes"));
router.use("/invitations", require("./invitations.routes"));
router.use("/entries", require("./entries.routes"));
router.use("/alerts", require("./alerts.routes"));
router.use("/analytics", require("./analytics.routes"));

router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

module.exports = router;
