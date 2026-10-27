const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const guardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    shift: { type: String, enum: ["morning", "evening", "night"], required: true },
    badgeNumber: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

toJSONPlugin(guardSchema);

module.exports = model("Guard", guardSchema);
