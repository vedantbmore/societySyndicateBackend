const bcrypt = require("bcryptjs");
const Resident = require("../models/Resident");
const Flat = require("../models/Flat");
const User = require("../models/User");
const env = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { generateTempPassword } = require("../utils/password");

const listResidents = asyncHandler(async (_req, res) => {
  const [residents, flats] = await Promise.all([Resident.find(), Flat.find()]);
  const flatById = new Map(flats.map((f) => [f.id, f]));

  const rows = residents
    .map((resident) => {
      const flat = flatById.get(resident.flatId.toString());
      return {
        ...resident.toJSON(),
        flatNumber: flat?.number ?? "-",
        building: flat?.building ?? "-",
      };
    })
    .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));

  res.json(rows);
});

const getMyResidentProfile = asyncHandler(async (req, res) => {
  res.json(req.residentProfile);
});

const createResident = asyncHandler(async (req, res) => {
  const { name, email, phone, flatId, isPrimary } = req.body;

  const flat = await Flat.findById(flatId);
  if (!flat) throw ApiError.notFound("Flat not found.");

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, env.BCRYPT_SALT_ROUNDS);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: "resident",
    flatId: flat.id,
  });

  let resident;
  try {
    resident = await Resident.create({
      userId: user.id,
      flatId: flat.id,
      name,
      phone,
      email: email.toLowerCase(),
      isPrimary,
    });
  } catch (err) {
    await User.findByIdAndDelete(user.id);
    throw err;
  }

  res.status(201).json({
    resident: { ...resident.toJSON(), flatNumber: flat.number, building: flat.building },
    temporaryPassword,
  });
});

module.exports = { listResidents, getMyResidentProfile, createResident };
