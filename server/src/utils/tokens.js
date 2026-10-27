const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAuthToken(user) {
  return jwt.sign({ sub: user.id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

// A 32-hex-char, cryptographically random pass code/QR payload — unguessable
// and short enough to type in manually at the gate.
function makeQrToken() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = { signAuthToken, verifyAuthToken, makeQrToken };
