const express = require("express");
const { sendOtp, verifyOtp , loginUser, resendOtp } = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);


module.exports = router;
