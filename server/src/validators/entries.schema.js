const { z } = require("zod");

const verifyTokenSchema = z.object({
  token: z.string().trim().min(1, "A pass code or QR token is required.").max(200),
  method: z.enum(["qr", "manual"]),
});

module.exports = { verifyTokenSchema };
