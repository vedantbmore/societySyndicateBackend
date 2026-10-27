const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "guard", "resident"], required: true, index: true },
    flatId: { type: Schema.Types.ObjectId, ref: "Flat" }, // resident only
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String }, // data URL of the profile photo
  },
  { timestamps: true }
);

toJSONPlugin(userSchema, { hide: ["passwordHash"] });

module.exports = model("User", userSchema);
