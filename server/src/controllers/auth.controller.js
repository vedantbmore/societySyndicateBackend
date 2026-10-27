const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { signAuthToken } = require("../utils/tokens");

function toAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    flatId: user.flatId ? user.flatId.toString() : undefined,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password.");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw ApiError.unauthorized("Invalid email or password.");

  const token = signAuthToken(user);
  res.json({ user: toAuthUser(user), token });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: toAuthUser(req.user) });
});

const updateAvatar = asyncHandler(async (req, res) => {
  req.user.avatarUrl = req.body.avatarUrl;
  await req.user.save();
  res.json({ user: toAuthUser(req.user) });
});

module.exports = { login, me, updateAvatar };
