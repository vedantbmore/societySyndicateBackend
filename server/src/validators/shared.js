const { z } = require("zod");

// A base64 image data URL, capped well above what the client-side resize
// (~480px longest side, JPEG) ever produces, to block abusive payloads.
const imageDataUrl = z
  .string()
  .trim()
  .max(3_000_000, "Image is too large.")
  .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Invalid image data.");

module.exports = { imageDataUrl };
