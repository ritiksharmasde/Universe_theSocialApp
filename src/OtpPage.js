import React, { useEffect, useRef, useState } from "react";
import API_BASE_URL from "./api";
function OtpPage({ email, onBack, onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    setError("");
    setMessage("");

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").trim();

    if (!/^\d{6}$/.test(pasted)) return;

    const pastedOtp = pasted.split("");
    setOtp(pastedOtp);
    setError("");
    setMessage("");
    inputsRef.current[5]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "OTP verification failed.");
        setMessage("");
        return;
      }

      setError("");
      setMessage("OTP verified successfully.");

      if (onVerify) {
        onVerify(data);
      }
    } catch (error) {
      setError("Server error. Please try again.");
      setMessage("");
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email}),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend OTP.");
        setMessage("");
        return;
      }

      setOtp(["", "", "", "", "", ""]);
      setError("");
      setMessage("A new OTP has been sent.");
      setSecondsLeft(30);
      inputsRef.current[0]?.focus();
    } catch (error) {
      setError("Server error. Please try again.");
      setMessage("");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>OTP Verification</h1>
        <p style={styles.subtitle}>
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        <div style={styles.otpRow} onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => (inputsRef.current[index] = element)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={styles.otpInput}
            />
          ))}
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}
        {message ? <p style={styles.success}>{message}</p> : null}

        <button style={styles.verifyButton} onClick={handleVerify}>
          Verify OTP
        </button>

        <div style={styles.bottomRow}>
          <button style={styles.linkButton} onClick={onBack}>
            Back
          </button>

          <button
            style={{
              ...styles.linkButton,
              opacity: secondsLeft > 0 ? 0.5 : 1,
              cursor: secondsLeft > 0 ? "not-allowed" : "pointer",
            }}
            onClick={handleResend}
            disabled={secondsLeft > 0}
          >
            {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "clamp(16px, 4vw, 32px)",
    boxSizing: "border-box",
  },
  title: {
    margin: 0,
padding: "clamp(16px, 4vw, 32px)",
    marginBottom: "12px",
  },
  subtitle: {
    marginTop: 0,
    marginBottom: "24px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  otpRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  otpInput: {
    width: "clamp(40px, 10vw, 52px)",
    height: "clamp(44px, 12vw, 58px)",
    fontSize: "clamp(18px, 5vw, 24px)",
    textAlign: "center",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#1e293b",
    color: "#ffffff",
    outline: "none",
  },
  error: {
    color: "#fda4af",
    marginBottom: "14px",
  },
  success: {
    color: "#86efac",
    marginBottom: "14px",
  },
  verifyButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "16px",
  },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  linkButton: {
    background: "transparent",
    border: "none",
    color: "#ffffff",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default OtpPage;