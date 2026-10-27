const { z } = require("zod");
const { imageDataUrl } = require("./shared");

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const updateAvatarSchema = z.object({
  avatarUrl: imageDataUrl.nullable(),
});

module.exports = { loginSchema, updateAvatarSchema };
