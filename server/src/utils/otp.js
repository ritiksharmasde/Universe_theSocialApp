const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

module.exports = {
  generateOtp,
  hashOtp,
};