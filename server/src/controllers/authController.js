const pool = require("../config/db");
const { generateOtp, hashOtp } = require("../utils/otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");
const createToken = (email) => {
  return jwt.sign(
    { email: email.toLowerCase().trim() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
const sendOtp = async (req, res) => {
  try {
    console.log("🔥 sendOtp hit");

    const { email, password, fullName } = req.body;
    console.log("📩 body:", email);

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("📧 normalized:", normalizedEmail);

    const emailRegex = /^[a-zA-Z]+\.[0-9]+@stu\.upes\.ac\.in$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Use a valid university email.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    console.log("🔍 checking existing user...");
    const existingUserResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    console.log("✅ user check done");

    const existingUser = existingUserResult.rows[0];

    if (existingUser && existingUser.password_hash) {
      return res.status(400).json({
        error: "Account already exists. Please log in.",
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log("💾 inserting OTP...");
    await pool.query(
      `
      INSERT INTO otp_codes (
        email,
        otp_code_hash,
        password_hash_temp,
        full_name_temp,
        expires_at,
        used,
        attempt_count
      )
      VALUES ($1, $2, $3, $4, $5, FALSE, 0)
      `,
      [normalizedEmail, otpHash, passwordHash, fullName || "", expiresAt]
    );
    console.log("✅ OTP inserted");

    console.log("📨 sending email via Resend...");

    const { error } = await transporter.emails.send({
      from: process.env.MAIL_FROM,
      to: normalizedEmail,
      subject: "Your UniVerse OTP Code",
      text: `Your UniVerse OTP is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Your OTP Code</h2>
          <p>Use the following OTP to verify your UniVerse account:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return res.status(500).json({ error: "Failed to send OTP email." });
    }

    console.log("✅ EMAIL SENT via Resend");

    return res.status(200).json({
      message: "OTP sent to email successfully.",
    });
  } catch (error) {
    console.error("❌ sendOtp error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO otp_codes (
        email,
        otp_code_hash,
        expires_at,
        used,
        attempt_count
      )
      VALUES ($1, $2, $3, FALSE, 0)
      `,
      [normalizedEmail, otpHash, expiresAt]
    );

    // 🔥 send via Resend (you already use it)
    await transporter.emails.send({
      from: process.env.MAIL_FROM,
      to: normalizedEmail,
      subject: "Reset Password OTP",
      html: `<h2>Your OTP: ${otp}</h2>`,
    });

    res.json({ message: "OTP sent for password reset" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT * FROM otp_codes
      WHERE email = $1 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [normalizedEmail]
    );

    const record = result.rows[0];

    if (!record) {
      return res.status(400).json({ error: "No OTP found" });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, record.otp_code_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [passwordHash, normalizedEmail]
    );

    await pool.query(
      `UPDATE otp_codes SET used = TRUE WHERE id = $1`,
      [record.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex = /^[a-zA-Z]+\.[0-9]+@stu\.upes\.ac\.in$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Use a valid university email.",
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `
      UPDATE otp_codes
      SET used = TRUE
      WHERE LOWER(email) = LOWER($1) AND used = FALSE
      `,
      [normalizedEmail]
    );

    const latestOtpResult = await pool.query(
      `
      SELECT password_hash_temp, full_name_temp
      FROM otp_codes
      WHERE LOWER(email) = LOWER($1)
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [normalizedEmail]
    );

    const latestOtpRow = latestOtpResult.rows[0];

    await pool.query(
      `
      INSERT INTO otp_codes (
        email,
        otp_code_hash,
        password_hash_temp,
        full_name_temp,
        expires_at,
        used,
        attempt_count
      )
      VALUES ($1, $2, $3, $4, $5, FALSE, 0)
      `,
      [
        normalizedEmail,
        otpHash,
        latestOtpRow?.password_hash_temp || null,
        latestOtpRow?.full_name_temp || "",
        expiresAt,
      ]
    );

    console.log("📨 resending email via Resend...");

    const { error } = await transporter.emails.send({
      from: process.env.MAIL_FROM,
      to: normalizedEmail,
      subject: "Your UniVerse OTP Code",
      text: `Your UniVerse OTP is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Your OTP Code</h2>
          <p>Use the following OTP to verify your UniVerse account:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ resendOtp Resend error:", error);
      return res.status(500).json({ error: "Failed to resend OTP email." });
    }

    console.log("✅ RESEND OTP SENT via Resend");

    return res.status(200).json({
      message: "OTP resent successfully.",
    });
  } catch (error) {
    console.error("❌ resendOtp error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No account found. Please sign up first.",
      });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({
        error: "Password not set for this account.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "Incorrect password.",
      });
    }

    const needsProfileSetup =
      !user.full_name || !user.course || !user.year;
  const token = createToken(user.email)
   return res.status(200).json({
  message: "Login successful.",
  token,
  user: {
    email: user.email,
  },
  needsProfileSetup,
});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: "Email and OTP are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT * FROM otp_codes
      WHERE email = $1 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "No OTP found for this email.",
      });
    }

    const otpRecord = result.rows[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        error: "OTP has expired.",
      });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp_code_hash);

    if (!isMatch) {
      await pool.query(
        `
        UPDATE otp_codes
        SET attempt_count = attempt_count + 1
        WHERE id = $1
        `,
        [otpRecord.id]
      );

      return res.status(400).json({
        error: "Invalid OTP.",
      });
    }

    await pool.query(
      `
      UPDATE otp_codes
      SET used = TRUE
      WHERE id = $1
      `,
      [otpRecord.id]
    );

    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    let isNewUser = false;
    let needsProfileSetup = true;

    if (userResult.rows.length === 0) {
      isNewUser = true;

      await pool.query(
        `
        INSERT INTO users (email, full_name, password_hash, is_verified)
        VALUES ($1, $2, $3, TRUE)
        `,
        [
          normalizedEmail,
          otpRecord.full_name_temp || "",
          otpRecord.password_hash_temp,
        ]
      );
    } else {
      const existingUser = userResult.rows[0];

      await pool.query(
        `
        UPDATE users
        SET
          is_verified = TRUE,
          password_hash = COALESCE(password_hash, $2),
          full_name = CASE
            WHEN full_name IS NULL OR full_name = '' THEN $3
            ELSE full_name
          END
        WHERE email = $1
        `,
        [
          normalizedEmail,
          otpRecord.password_hash_temp,
          otpRecord.full_name_temp || "",
        ]
      );

      needsProfileSetup =
        !existingUser.full_name || !existingUser.course || !existingUser.year;
    }
const token = createToken(normalizedEmail);
    return res.status(200).json({
  message: "OTP verified successfully.",
  token,
  isNewUser,
  needsProfileSetup,
});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendOtp,
  resendOtp,
  loginUser,
  verifyOtp,
};
