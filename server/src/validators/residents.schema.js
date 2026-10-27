const { z } = require("zod");

const createResidentSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Phone number is required."),
  flatId: z.string().trim().min(1, "Select a flat."),
  isPrimary: z.boolean().optional().default(true),
});

module.exports = { createResidentSchema };
