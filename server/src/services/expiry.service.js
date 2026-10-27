const cron = require("node-cron");
const VisitorInvitation = require("../models/VisitorInvitation");

// Flips any pending/approved invitation whose validity window has passed to
// "expired". Cheap indexed query — safe to call on every relevant read as
// well as on a schedule, so status is always accurate regardless of when a
// request happens to land relative to expiry.
async function reconcileExpiredInvitations() {
  await VisitorInvitation.updateMany(
    { status: { $in: ["pending", "approved"] }, validUntil: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
}

function startExpiryJob() {
  // Every 5 minutes.
  cron.schedule("*/5 * * * *", () => {
    reconcileExpiredInvitations().catch((err) => {
      console.error("[expiry-job] failed:", err.message);
    });
  });
}

module.exports = { reconcileExpiredInvitations, startExpiryJob };
