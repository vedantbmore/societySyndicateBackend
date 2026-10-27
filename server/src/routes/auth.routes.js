const { Router } = require("express");
const ctrl = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate");
const { loginSchema, updateAvatarSchema } = require("../validators/auth.schema");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), ctrl.login);
router.get("/me", requireAuth, ctrl.me);
router.patch("/me/avatar", requireAuth, validate(updateAvatarSchema), ctrl.updateAvatar);

module.exports = router;
