const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { FIRST_NAMES, LAST_NAMES, VISITOR_NAMES } = require("./names");
const { makeRng, pick, intBetween } = require("./rng");
const { makeQrToken } = require("../utils/tokens");
const env = require("../config/env");

const { ObjectId } = mongoose.Types;
const BUILDINGS = ["A", "B", "C"];
const VISITOR_TYPES = ["guest", "delivery", "cab", "service"];
const PURPOSES = {
  guest: ["Family visit", "Friend visiting", "Birthday celebration", "Social visit"],
  delivery: ["Grocery delivery", "Food delivery", "Amazon parcel", "Furniture delivery"],
  cab: ["Ola pickup", "Uber drop-off", "Airport cab", "Local cab"],
  service: ["Plumber visit", "Electrician visit", "AC service", "Appliance repair", "Pest control"],
};

function phoneFor(seedIndex) {
  const base = 7000000000 + ((seedIndex * 137) % 999999999);
  return `+91 ${String(base).slice(0, 5)} ${String(base).slice(5, 10)}`;
}

function emailFor(name, tag) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}.${tag}@greenview.demo`;
}

// Builds the full GreenView Residency demo dataset as plain objects ready
// for Model.insertMany — a 1:1 port of the frontend's src/mock/seedData.ts
// so the demo experience is identical, but persisted in MongoDB with
// properly hashed passwords instead of plaintext in localStorage.
function buildSeed() {
  const rng = makeRng(42);
  const passwordHash = bcrypt.hashSync(env.SEED_DEMO_PASSWORD, env.BCRYPT_SALT_ROUNDS);

  // --- Flats ---------------------------------------------------------------
  const flats = [];
  for (const building of BUILDINGS) {
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 2; unit++) {
        flats.push({
          _id: new ObjectId(),
          building,
          number: `${building}-${floor}0${unit}`,
          floor,
        });
      }
    }
  }

  // --- Residents + resident users -------------------------------------------
  const residents = [];
  const users = [];
  flats.forEach((flat, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 5) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const residentId = new ObjectId();
    const userId = new ObjectId();
    const email = emailFor(name, "flat");
    residents.push({
      _id: residentId,
      userId,
      flatId: flat._id,
      name,
      phone: phoneFor(i + 1),
      email,
      isPrimary: true,
    });
    users.push({
      _id: userId,
      name,
      email,
      phone: phoneFor(i + 1),
      passwordHash,
      role: "resident",
      flatId: flat._id,
    });
  });

  // --- Guards ----------------------------------------------------------------
  const guardShifts = ["morning", "morning", "evening", "evening", "night"];
  const guards = [];
  guardShifts.forEach((shift, i) => {
    const first = FIRST_NAMES[(i + 20) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3 + 2) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const guardId = new ObjectId();
    const userId = new ObjectId();
    guards.push({
      _id: guardId,
      userId,
      name,
      phone: phoneFor(i + 100),
      shift,
      badgeNumber: `G-${String(i + 1).padStart(2, "0")}`,
    });
    users.push({
      _id: userId,
      name,
      email: emailFor(name, "guard"),
      phone: phoneFor(i + 100),
      passwordHash,
      role: "guard",
    });
  });

  // --- Admin -------------------------------------------------------------------
  users.push({
    _id: new ObjectId(),
    name: "Vikas Kushwaha",
    email: "vikaskushwaha18082004@gmail.com",
    phone: phoneFor(500),
    passwordHash,
    role: "admin",
  });

  // --- Invitations + entries ----------------------------------------------------
  const invitations = [];
  const entries = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  function addInvitation(opts) {
    const createdAt = new Date(now - opts.daysAgo * DAY - intBetween(rng, 0, 6) * 3600_000);
    const expectedArrival = new Date(createdAt.getTime() + intBetween(rng, 30, 180) * 60_000);
    if (opts.forceEntryHour !== undefined) {
      expectedArrival.setHours(opts.forceEntryHour, intBetween(rng, 0, 59), 0, 0);
    }
    const validUntil = new Date(expectedArrival.getTime() + intBetween(rng, 3, 8) * 3600_000);

    const inFuture = expectedArrival.getTime() > now;
    let status;
    if (opts.forceStatus) {
      status = opts.forceStatus;
    } else if (inFuture) {
      status = pick(rng, ["pending", "approved", "pending"]);
    } else if (validUntil.getTime() < now) {
      const roll = rng();
      status = roll < 0.62 ? "used" : roll < 0.78 ? "expired" : roll < 0.9 ? "rejected" : "cancelled";
    } else {
      status = "approved";
    }

    const invitation = {
      _id: new ObjectId(),
      visitor: { name: opts.visitorName, phone: opts.visitorPhone, type: opts.type },
      hostFlatId: opts.hostFlat._id,
      hostResidentId: opts.hostResident._id,
      purpose: pick(rng, PURPOSES[opts.type]),
      expectedArrival,
      validUntil,
      status,
      qrToken: makeQrToken(),
      createdAt,
    };
    invitations.push(invitation);

    if (status === "used") {
      const entryTime = new Date(expectedArrival.getTime() + intBetween(rng, 5, 40) * 60_000);
      const guard = pick(rng, guards);
      const stillInside = rng() < 0.12;
      const entry = {
        _id: new ObjectId(),
        invitationId: invitation._id,
        visitorName: invitation.visitor.name,
        visitorType: invitation.visitor.type,
        flatId: invitation.hostFlatId,
        entryGuardId: guard._id,
        entryTime,
        entryMethod: rng() < 0.8 ? "qr" : "manual",
      };
      if (!stillInside) {
        entry.exitTime = new Date(entryTime.getTime() + intBetween(rng, 20, 240) * 60_000);
        entry.exitGuardId = pick(rng, guards)._id;
      }
      entries.push(entry);
    }

    return invitation;
  }

  for (let d = 13; d >= 0; d--) {
    const perDay = intBetween(rng, 1, 3);
    for (let k = 0; k < perDay; k++) {
      const flat = pick(rng, flats);
      const resident = residents.find((r) => r.flatId.equals(flat._id));
      addInvitation({
        daysAgo: d,
        hostFlat: flat,
        hostResident: resident,
        visitorName: pick(rng, VISITOR_NAMES),
        visitorPhone: phoneFor(intBetween(rng, 1000, 9999)),
        type: pick(rng, VISITOR_TYPES),
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    const flat = pick(rng, flats);
    const resident = residents.find((r) => r.flatId.equals(flat._id));
    const invitation = addInvitation({
      daysAgo: -intBetween(rng, 0, 2),
      hostFlat: flat,
      hostResident: resident,
      visitorName: pick(rng, VISITOR_NAMES),
      visitorPhone: phoneFor(intBetween(rng, 1000, 9999)),
      type: pick(rng, VISITOR_TYPES),
    });
    invitation.status = i === 0 ? "pending" : "approved";
  }

  // --- Scripted scenarios to guarantee security-alert patterns ------------------
  const alerts = [];

  {
    const flat = pick(rng, flats);
    const resident = residents.find((r) => r.flatId.equals(flat._id));
    const inv = addInvitation({
      daysAgo: 2,
      hostFlat: flat,
      hostResident: resident,
      visitorName: pick(rng, VISITOR_NAMES),
      visitorPhone: phoneFor(9001),
      type: "cab",
      forceStatus: "used",
      forceEntryHour: 2,
    });
    alerts.push({
      _id: new ObjectId(),
      type: "unusual_hour",
      severity: "medium",
      title: "Unusual Visit Time",
      description: `Visitor "${inv.visitor.name}" entered at 2:30 AM for flat ${flat.number}. Typical visit time for this flat is 6 PM - 9 PM.`,
      recommendation: "Manual verification recommended for late-night entries.",
      relatedInvitationId: inv._id,
      status: "open",
      createdAt: inv.expectedArrival,
    });
  }

  {
    const flat = pick(rng, flats);
    const resident = residents.find((r) => r.flatId.equals(flat._id));
    const inv = addInvitation({
      daysAgo: 3,
      hostFlat: flat,
      hostResident: resident,
      visitorName: pick(rng, VISITOR_NAMES),
      visitorPhone: phoneFor(9002),
      type: "delivery",
      forceStatus: "expired",
    });
    alerts.push({
      _id: new ObjectId(),
      type: "expired_token",
      severity: "low",
      title: "Expired Pass Scan Attempt",
      description: `A guard attempted to verify an expired visitor pass for "${inv.visitor.name}" at flat ${flat.number}. The pass had already expired.`,
      recommendation: "Ask the visitor to request a new invitation from the resident.",
      relatedInvitationId: inv._id,
      status: "open",
      createdAt: new Date(inv.validUntil.getTime() + 20 * 60_000),
    });
  }

  alerts.push({
    _id: new ObjectId(),
    type: "repeated_failure",
    severity: "high",
    title: "Repeated Verification Failures",
    description:
      "3 failed QR scan attempts were recorded at the main gate within 10 minutes using an invalid token.",
    recommendation: "Guard should switch to manual verification and contact the security desk.",
    status: "open",
    createdAt: new Date(now - 5 * 3600_000),
  });

  {
    const [flatA, flatB] = [flats[3], flats[9]];
    const residentA = residents.find((r) => r.flatId.equals(flatA._id));
    const residentB = residents.find((r) => r.flatId.equals(flatB._id));
    const sharedPhone = phoneFor(9003);
    const sharedName = "Ramesh Kumar";
    addInvitation({
      daysAgo: 5,
      hostFlat: flatA,
      hostResident: residentA,
      visitorName: sharedName,
      visitorPhone: sharedPhone,
      type: "service",
      forceStatus: "used",
    });
    const inv2 = addInvitation({
      daysAgo: 4,
      hostFlat: flatB,
      hostResident: residentB,
      visitorName: sharedName,
      visitorPhone: sharedPhone,
      type: "service",
      forceStatus: "used",
    });
    alerts.push({
      _id: new ObjectId(),
      type: "multi_flat_visitor",
      severity: "medium",
      title: "Visitor Requested by Multiple Flats",
      description: `"${sharedName}" was invited by both flat ${flatA.number} and flat ${flatB.number} within a few days.`,
      recommendation: "Confirm the visitor's purpose with both flats before granting entry.",
      relatedInvitationId: inv2._id,
      status: "open",
      createdAt: inv2.createdAt,
    });
  }

  return { users, flats, residents, guards, invitations, entries, alerts };
}

module.exports = { buildSeed };
