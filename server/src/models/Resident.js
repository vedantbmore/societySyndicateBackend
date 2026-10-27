const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const residentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    flatId: { type: Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    isPrimary: { type: Boolean, default: true },
  },
  { timestamps: true }
);

toJSONPlugin(residentSchema);

module.exports = model("Resident", residentSchema);
