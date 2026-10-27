const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const visitorSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    type: { type: String, enum: ["guest", "delivery", "cab", "service"], required: true },
    photoUrl: { type: String }, // data URL of the visitor's photo, for gate verification
  },
  { _id: false }
);

const invitationSchema = new Schema(
  {
    visitor: { type: visitorSnapshotSchema, required: true },
    hostFlatId: { type: Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    hostResidentId: { type: Schema.Types.ObjectId, ref: "Resident", required: true, index: true },
    purpose: { type: String, required: true, trim: true },
    expectedArrival: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "used", "expired", "cancelled"],
      default: "approved",
      index: true,
    },
    qrToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

toJSONPlugin(invitationSchema);

module.exports = model("VisitorInvitation", invitationSchema);
