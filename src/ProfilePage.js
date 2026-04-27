import React, { useState, useEffect } from "react";
import API_BASE_URL from "./api";

const premiumGlass = {
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};
function ProfilePage({ email, onBack, onComplete }) {
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
  username: "", 
  course: "",
  year: "",
  bio: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    const imageFormData = new FormData();
    imageFormData.append("image", profileImage);

    try {
      const response = await fetch(`${API_BASE_URL}/user/upload-profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: imageFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Image upload failed");
        return null;
      }

      return data.imageUrl;
    } catch (error) {
      alert("Server error while uploading image");
      return null;
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!formData.username.trim()) nextErrors.username = "Username is required.";
    if (!formData.course.trim()) nextErrors.course = "Course is required.";

    if (!formData.year.trim()) {
      nextErrors.year = "Year is required.";
    } else if (!/^[1-5]$/.test(formData.year)) {
      nextErrors.year = "Year must be between 1 and 5.";
    }

    if (formData.bio.length > 120) {
      nextErrors.bio = "Bio must be 120 characters or less.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    let imageUrl = null;

    if (profileImage) {
      imageUrl = await uploadProfileImage();
      if (!imageUrl) return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/save-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username || "",
          course: formData.course,
          year: formData.year,
          branch: formData.branch || "",
          bio: formData.bio || "",
          interests: formData.interests || "",
          skills: formData.skills || "",
          city: formData.city || "",
          linkedin: formData.linkedin || "",
          github: formData.github || "",
          profileImage: imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to save profile");
        return;
      }

      if (onComplete) {
        onComplete({
          ...formData,
          profileImage: imageUrl
            ? imageUrl.startsWith("http")
              ? imageUrl
              : `${API_BASE_URL}${imageUrl}`
            : previewUrl || "",
        });
      }
    } catch (error) {
      console.error("Profile save frontend error:", error);
      alert("Server error");
    }
  };

  const avatarSrc =
    previewUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      formData.fullName || "User"
    )}&background=6366f1&color=fff&bold=true`;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.badge}>Student Profile</div>

          <div style={styles.avatarRing}>
            <img src={avatarSrc} alt="Profile" style={styles.avatar} />
          </div>

          <h1 style={styles.title}>Complete Your Profile</h1>
          <p style={styles.subtitle}>
            Build your campus identity for <strong>{email}</strong>
          </p>

          <label style={styles.uploadButton}>
            {profileImage ? "Change Photo" : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>

          {profileImage && <p style={styles.fileName}>{profileImage.name}</p>}
        </section>

        <section style={styles.formCard}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <InputField
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />
                <InputField
    label="Username"
    name="username"
    placeholder="e.g. john_doe"
    value={formData.username}
    onChange={handleChange}
    error={errors.username}
  />

              <InputField
                label="Course"
                name="course"
                placeholder="e.g. B.Tech CSE"
                value={formData.course}
                onChange={handleChange}
                error={errors.course}
              />

              <InputField
                label="Year"
                name="year"
                placeholder="1 to 5"
                value={formData.year}
                onChange={handleChange}
                error={errors.year}
              />
            </div>

            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Bio</label>
                <span style={styles.counter}>{formData.bio.length}/120</span>
              </div>

              <textarea
                name="bio"
                placeholder="Write a short bio about yourself..."
                value={formData.bio}
                onChange={handleChange}
                style={styles.textarea}
              />

              {errors.bio && <p style={styles.error}>{errors.bio}</p>}
            </div>

            <button type="submit" style={styles.primaryButton}>
              Save Profile
            </button>

            <button type="button" onClick={onBack} style={styles.backButton}>
              Back
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function InputField({ label, error, ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input {...props} style={styles.input} />
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  page: {
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 34%), #0f172a",
  color: "#f8fafc",
  padding: "clamp(14px, 3vw, 28px)",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

  shell: {
    width: "100%",
    maxWidth: "1060px",
    display: "grid",
    gridTemplateColumns: "minmax(280px, 380px) minmax(0, 1fr)",
    gap: "22px",
  },

  heroCard: {
  ...premiumGlass,
  borderRadius: "30px",
  padding: "34px 24px",
  textAlign: "center",
},

  badge: {
    display: "inline-flex",
    padding: "8px 13px",
    borderRadius: "999px",
    background: "rgba(99,102,241,0.16)",
    color: "var(--text-primary)",
    border: "1px solid rgba(99,102,241,0.28)",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: "22px",
  },

  avatarRing: {
    width: "148px",
    height: "148px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    padding: "5px",
    background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
    boxShadow: "0 18px 50px rgba(99,102,241,0.35)",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "5px solid var(--bg-surface)",
    boxSizing: "border-box",
  },

  title: {
  margin: "0 0 10px",
  fontSize: "clamp(28px, 4vw, 42px)",
  lineHeight: 1.05,
  fontWeight: "900",
  letterSpacing: "-0.04em",
  color: "#f8fafc",
},

 subtitle: {
  margin: "0 auto 24px",
  maxWidth: "320px",
  color: "#cbd5e1",
  lineHeight: 1.65,
  fontSize: "14px",
},
  uploadButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(99,102,241,0.32)",
  },

  fileName: {
    margin: "12px 0 0",
    fontSize: "12px",
    color: "var(--text-secondary)",
    wordBreak: "break-word",
  },

  formCard: {
  ...premiumGlass,
  borderRadius: "30px",
  padding: "clamp(20px, 4vw, 34px)",
},

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  label: {
  fontSize: "13px",
  fontWeight: "800",
  color: "#e5e7eb",
},

  counter: {
  fontSize: "12px",
  color: "#94a3b8",
},

  input: {
  width: "100%",
  padding: "14px 15px",
  borderRadius: "16px",
  background: "rgba(15, 23, 42, 0.76)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
  fontSize: "14px",
},
  textarea: {
  width: "100%",
  minHeight: "132px",
  padding: "14px 15px",
  borderRadius: "18px",
  background: "rgba(15, 23, 42, 0.76)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  color: "#f8fafc",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
  fontSize: "14px",
  lineHeight: 1.6,
},

  error: {
    margin: 0,
    color: "#fb7185",
    fontSize: "13px",
    fontWeight: "600",
  },

  primaryButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    boxShadow: "0 18px 36px rgba(99,102,241,0.35)",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
  },

 backButton: {
  background: "transparent",
  border: "none",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  padding: "4px",
},
};

export default ProfilePage;
