const crypto = require("crypto");

// Generates a short, readable temporary password for a newly onboarded
// account (e.g. "k7m2-p9qw"), shown once to the admin so it can be shared
// with the new member.
function generateTempPassword() {
  const raw = crypto.randomBytes(6).toString("hex");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

module.exports = { generateTempPassword };
