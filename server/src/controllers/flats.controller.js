const Flat = require("../models/Flat");
const Resident = require("../models/Resident");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");

const listFlats = asyncHandler(async (_req, res) => {
  const [flats, residents] = await Promise.all([
    Flat.find().sort({ number: 1 }),
    Resident.find(),
  ]);
  const residentByFlat = new Map(residents.map((r) => [r.flatId.toString(), r]));

  const rows = flats.map((flat) => {
    const resident = residentByFlat.get(flat.id);
    return {
      ...flat.toJSON(),
      residentName: resident?.name ?? null,
      residentPhone: resident?.phone ?? null,
    };
  });
  res.json(rows);
});

const getFlat = asyncHandler(async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) throw ApiError.notFound("Flat not found.");
  res.json(flat);
});

module.exports = { listFlats, getFlat };
