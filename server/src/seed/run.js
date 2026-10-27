const { connectDb, disconnectDb } = require("../config/db");
const { buildSeed } = require("./seedData");

const User = require("../models/User");
const Flat = require("../models/Flat");
const Resident = require("../models/Resident");
const Guard = require("../models/Guard");
const VisitorInvitation = require("../models/VisitorInvitation");
const VisitorEntry = require("../models/VisitorEntry");
const SecurityAlert = require("../models/SecurityAlert");

const MODELS = [User, Flat, Resident, Guard, VisitorInvitation, VisitorEntry, SecurityAlert];

async function main() {
  const force = process.argv.includes("--force");

  await connectDb();

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    console.log(
      `[seed] database already has ${existingUsers} user(s). Re-run with --force to wipe and reseed.`
    );
    await disconnectDb();
    return;
  }

  console.log("[seed] clearing existing collections...");
  await Promise.all(MODELS.map((m) => m.deleteMany({})));

  console.log("[seed] generating GreenView Residency demo dataset...");
  const seed = buildSeed();

  await User.insertMany(seed.users);
  await Flat.insertMany(seed.flats);
  await Resident.insertMany(seed.residents);
  await Guard.insertMany(seed.guards);
  await VisitorInvitation.insertMany(seed.invitations);
  await VisitorEntry.insertMany(seed.entries);
  await SecurityAlert.insertMany(seed.alerts);

  console.log(
    `[seed] done: ${seed.users.length} users, ${seed.flats.length} flats, ${seed.residents.length} residents, ` +
    `${seed.guards.length} guards, ${seed.invitations.length} invitations, ${seed.entries.length} entries, ` +
    `${seed.alerts.length} alerts.`
  );
  console.log("[seed] all demo accounts share the password set in SEED_DEMO_PASSWORD (.env), default 'vikas123'.");
  console.log("[seed] admin login: vikaskushwaha18082004@gmail.com");

  await disconnectDb();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
