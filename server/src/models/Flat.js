const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const flatSchema = new Schema(
  {
    building: { type: String, enum: ["A", "B", "C"], required: true },
    number: { type: String, required: true, unique: true, trim: true },
    floor: { type: Number, required: true },
  },
  { timestamps: true }
);

toJSONPlugin(flatSchema);

module.exports = model("Flat", flatSchema);
