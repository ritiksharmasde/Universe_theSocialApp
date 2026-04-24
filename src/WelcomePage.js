import React, { useMemo, useState } from "react";
import API_BASE_URL from "./api";

export default function UniversitySocialWelcomePage({
  onContinue,
  onLoginSuccess,
}) {
  const [mode, setMode] = useState("signup");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [resetData, setResetData] = useState({
  otp: "",
  newPassword: "",
});
  
  const heading = useMemo(() => {
  if (mode === "signup") return "Join your campus community";
  if (mode === "login") return "Welcome back";
  return "Reset your password";
}, [mode]);

  const subheading = useMemo(() => {
  if (mode === "signup")
    return "Create your account and connect with verified university students.";
  if (mode === "login")
    return "Log in to continue to your university social network.";
  return "Enter your email to receive a reset OTP.";
}, [mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setMessage("");
  };
const handleForgotPassword = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setErrors({ email: data.error });
      return;
    }

    setMessage("OTP sent to your email");
    setMode("reset");
  } catch (err) {
    console.error(err);
  }
};
  const handleResetPassword = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email.toLowerCase().trim(),
        otp: resetData.otp,
        newPassword: resetData.newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error);
      return;
    }

    setMessage("Password reset successful");

    setMode("login");
  } catch (err) {
    console.error(err);
  }
};
  const validateForm = () => {
    const nextErrors = {};

    if (mode === "signup" && !formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "University email is required.";
    } else if (!/^[a-zA-Z]+\.[0-9]+@stu\.upes\.ac\.in$/.test(formData.email.trim())) {
      nextErrors.email =
        "Use your university email (e.g., ritik.17886@stu.upes.ac.in)";
    }

    if (mode !== "forgot" && mode !== "reset") {
  if (!formData.password.trim()) {
    nextErrors.password = "Password is required.";
  } else if (formData.password.length < 8) {
    nextErrors.password = "Password must be at least 8 characters.";
  }
}

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setMessage("");

    try {
      const endpoint =
        mode === "signup"
          ? `${API_BASE_URL}/auth/send-otp`
          : `${API_BASE_URL}/auth/login`;

      const payload =
        mode === "signup"
          ? {
              fullName: formData.fullName.trim(),
              email: formData.email.toLowerCase().trim(),
              password: formData.password,
            }
          : {
              email: formData.email.toLowerCase().trim(),
              password: formData.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          email: data.error || "Request failed.",
        }));
        setMessage("");
        return;
      }

      if (mode === "signup") {
        onContinue?.(formData.email.toLowerCase().trim());
        return;
      }

      if (mode === "login") {
        onLoginSuccess?.(formData.email.toLowerCase().trim(), data);
      }
    } catch (error) {
      console.log("AUTH ERROR:", error);
      setMessage("");
      setErrors((prev) => ({
        ...prev,
        email: "Server error: " + error.message,
      }));
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setMessage("");
    setFormData((prev) => ({
      ...prev,
      password: "",
    }));
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.22),_transparent_30%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <section className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-8 py-2 text-lg text-slate-200 backdrop-blur">
              <strong>UniVerse</strong>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Introducing UniVerse
              </h1>
              <p className="max-w-xl text-base text-slate-300 sm:text-lg">
                A space that feels like your campus, even beyond the classroom.
                Connect with campus mates, find your people, and grow together
                in one trusted community.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard
                title="Verified Students"
                text="Only university users can access the platform."
              />
              <FeatureCard
                title="Study Groups"
                text="Create and join focused course communities."
              />
              <FeatureCard
                title="Smart Feed"
                text="Share memories, doubts, and academic discussions."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8 max-w-md w-full mx-auto">
            <div className="mb-6 flex rounded-2xl bg-slate-900/70 p-1">
              <ToggleButton
                active={mode === "signup"}
                onClick={() => switchMode("signup")}
                label="Create account"
              />
              <ToggleButton
                active={mode === "login"}
                onClick={() => switchMode("login")}
                label="Already have an account"
              />
            </div>

            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold">{heading}</h2>
              <p className="text-sm text-slate-300">{subheading}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>

  {/* FULL NAME ONLY FOR SIGNUP */}
  {mode === "signup" && (
    <InputField
      label="Full Name"
      name="fullName"
      type="text"
      placeholder="Enter your name"
      value={formData.fullName}
      onChange={handleChange}
      error={errors.fullName}
    />
  )}

  {/* EMAIL (ALWAYS) */}
  <InputField
    label="University Email"
    name="email"
    type="email"
    placeholder="you@stu.upes.ac.in"
    value={formData.email}
    onChange={handleChange}
    error={errors.email}
  />

  {/* PASSWORD (NOT IN FORGOT) */}
  {mode !== "forgot" && mode !== "reset" && (
    <InputField
      label="Password"
      name="password"
      type="password"
      placeholder={
        mode === "signup"
          ? "Create a password"
          : "Enter your password"
      }
      value={formData.password}
      onChange={handleChange}
      error={errors.password}
    />
  )}

  {/* FORGOT BUTTON (ONLY IN LOGIN) */}
  {mode === "login" && (
    <div className="text-right text-sm mt-1">
      <button
        type="button"
        onClick={() => setMode("forgot")}
        className="text-slate-300 hover:text-white underline"
      >
        Forgot password?
      </button>
    </div>
  )}
{mode === "reset" && (
  <>
    <InputField
      label="OTP"
      name="otp"
      type="text"
      placeholder="Enter OTP"
      value={resetData.otp}
      onChange={(e) =>
        setResetData({ ...resetData, otp: e.target.value })
      }
    />

    <InputField
      label="New Password"
      name="newPassword"
      type="password"
      placeholder="Enter new password"
      value={resetData.newPassword}
      onChange={(e) =>
        setResetData({
          ...resetData,
          newPassword: e.target.value,
        })
      }
    />
  </>
)}

  {/* MAIN BUTTON */}
{mode === "forgot" ? (
  <button
    type="button"
    onClick={handleForgotPassword}
    className="w-full rounded-2xl bg-white px-3 py-2.5 font-semibold text-slate-950"
  >
    Send OTP
  </button>
) : mode === "reset" ? (
  <button
    type="button"
    onClick={handleResetPassword}
    className="w-full rounded-2xl bg-white px-3 py-2.5 font-semibold text-slate-950"
  >
    Reset Password
  </button>
) : (
  <button
    type="submit"
    className="w-full rounded-2xl bg-white px-3 py-2.5 font-semibold text-slate-950"
  >
    {mode === "signup" ? "Continue" : "Log in"}
  </button>
)}{mode === "forgot" && (
  <div className="text-center text-sm mt-2">
    <button
      type="button"
      onClick={() => setMode("login")}
      className="text-slate-300 hover:text-white underline"
    >
      Back to login
    </button>
  </div>
)}
</form>
            {message && (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>
                {mode === "signup"
                  ? "Already have an account?"
                  : "Need a new account?"}
              </span>
              <button
                type="button"
                onClick={() =>
                  switchMode(mode === "signup" ? "login" : "signup")
                }
                className="font-semibold text-white underline underline-offset-4"
              >
                {mode === "signup" ? "Log in" : "Create account"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-1/2 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950 shadow-lg"
          : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function InputField({ label, error, ...props }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-white/30"
      />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}
