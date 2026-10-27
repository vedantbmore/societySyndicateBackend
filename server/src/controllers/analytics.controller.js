const VisitorInvitation = require("../models/VisitorInvitation");
const VisitorEntry = require("../models/VisitorEntry");
const { asyncHandler } = require("../utils/asyncHandler");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const getDashboardStats = asyncHandler(async (_req, res) => {
  const today = new Date();

  const [totalInvitations, visitorsToday, currentlyInside, expiredOrRejected, invitationsForRepeat, exitedEntries] =
    await Promise.all([
      VisitorInvitation.countDocuments(),
      VisitorEntry.countDocuments({ entryTime: { $gte: startOfDay(today), $lte: endOfDay(today) } }),
      VisitorEntry.countDocuments({ exitTime: null }),
      VisitorInvitation.countDocuments({ status: { $in: ["expired", "rejected", "cancelled"] } }),
      VisitorInvitation.find().select("visitor.phone"),
      VisitorEntry.find({ exitTime: { $ne: null } }).select("entryTime exitTime"),
    ]);

  const phoneCounts = new Map();
  for (const inv of invitationsForRepeat) {
    const phone = inv.visitor.phone;
    phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
  }
  const repeatVisitors = [...phoneCounts.values()].filter((c) => c > 1).length;

  const durations = exitedEntries.map((e) => (e.exitTime.getTime() - e.entryTime.getTime()) / 60000);
  const avgVisitMinutes = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  res.json({
    totalInvitations,
    visitorsToday,
    currentlyInside,
    expiredOrRejected,
    repeatVisitors,
    avgVisitMinutes,
  });
});

const getVisitorsByDay = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);
  const now = new Date();

  const earliest = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 3600_000));
  const entries = await VisitorEntry.find({ entryTime: { $gte: earliest } }).select("entryTime");

  const counts = new Map();
  for (const e of entries) {
    const key = startOfDay(e.entryTime).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const ref = new Date(now.getTime() - i * 24 * 3600_000);
    const key = startOfDay(ref).getTime();
    result.push({
      date: ref.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      count: counts.get(key) ?? 0,
    });
  }
  res.json(result);
});

const getVisitorsByType = asyncHandler(async (_req, res) => {
  const types = ["guest", "delivery", "cab", "service"];
  const counts = await VisitorInvitation.aggregate([
    { $group: { _id: "$visitor.type", count: { $sum: 1 } } },
  ]);
  const countByType = new Map(counts.map((c) => [c._id, c.count]));
  res.json(types.map((type) => ({ type, count: countByType.get(type) ?? 0 })));
});

module.exports = { getDashboardStats, getVisitorsByDay, getVisitorsByType };
