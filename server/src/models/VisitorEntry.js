const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const entrySchema = new Schema(
  {
    invitationId: { type: Schema.Types.ObjectId, ref: "VisitorInvitation", required: true, index: true },
    visitorName: { type: String, required: true },
    visitorType: { type: String, enum: ["guest", "delivery", "cab", "service"], required: true },
    flatId: { type: Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    entryGuardId: { type: Schema.Types.ObjectId, ref: "Guard", required: true },
    entryTime: { type: Date, required: true },
    entryMethod: { type: String, enum: ["qr", "manual"], required: true },
    exitGuardId: { type: Schema.Types.ObjectId, ref: "Guard" },
    exitTime: { type: Date, index: true },
  },
  { timestamps: true }
);

toJSONPlugin(entrySchema);

module.exports = model("VisitorEntry", entrySchema);
