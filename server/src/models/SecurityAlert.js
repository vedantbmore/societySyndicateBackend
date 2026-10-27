const { Schema, model } = require("mongoose");
const { toJSONPlugin } = require("./plugins/toJSON");

const alertSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["unusual_hour", "expired_token", "repeated_failure", "multi_flat_visitor"],
      required: true,
    },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    recommendation: { type: String, required: true },
    relatedInvitationId: { type: Schema.Types.ObjectId, ref: "VisitorInvitation" },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
  },
  { timestamps: true }
);

toJSONPlugin(alertSchema);

module.exports = model("SecurityAlert", alertSchema);
