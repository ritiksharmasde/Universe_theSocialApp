import React, { useState, useEffect } from "react";
import API_BASE_URL from "./api";

function ProfilePage({ email, onBack, onComplete }) {
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    course: "",
    year: "",
    bio: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
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

    setMessage("");
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
    imageFormData.append("email", email);

    try {
      const response = await fetch(`${API_BASE_URL}/user/upload-profile-image`, {
        method: "POST",
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

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.course.trim()) {
      nextErrors.course = "Course is required.";
    }

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
      if (!imageUrl && profileImage) {
        alert("Image upload failed");
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/save-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName: formData.fullName,
          username: formData.username || "",
          course: formData.course,
          year: formData.year,
          section: formData.section || "",
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Complete Your Profile</h1>
        <p style={styles.subtitle}>
          Set up your student profile for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <InputField
            label="Full Name"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
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
            placeholder="Enter year (1 to 5)"
            value={formData.year}
            onChange={handleChange}
            error={errors.year}
          />

          <div style={styles.field}>
            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              placeholder="Write a short bio"
              value={formData.bio}
              onChange={handleChange}
              style={styles.textarea}
            />
            {errors.bio ? <p style={styles.error}>{errors.bio}</p> : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profile Image</label>
            <div style={styles.imageContainer}>
              <img
                src={
                  previewUrl
                    ? previewUrl
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || "User")}`
                }
                alt="Profile"
                style={styles.avatar}
              />

              <div style={styles.uploadWrapper}>
                <label style={styles.uploadButton}>
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>

                {profileImage && (
                  <span style={styles.fileName}>{profileImage.name}</span>
                )}
              </div>

              
            </div>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                style={styles.previewImage}
              />
            ) : null}
          </div>

          {message ? <p style={styles.success}>{message}</p> : null}

          <button type="submit" style={styles.primaryButton}>
            Save Profile
          </button>
        </form>

        <button type="button" onClick={onBack} style={styles.linkButton}>
          Back
        </button>
      </div>
    </div>
  );
}

function InputField({ label, error, ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input {...props} style={styles.input} />
      {error ? <p style={styles.error}>{error}</p> : null}
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
  imageContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "clamp(80px, 25vw, 120px)",
    height: "clamp(80px, 25vw, 120px)",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #334155",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "clamp(16px, 4vw, 32px)",
    boxSizing: "border-box",
  },
  title: {
    margin: 0,
    fontSize: "clamp(22px, 5vw, 32px)",
    marginBottom: "12px",
  },
  subtitle: {
    marginTop: 0,
    marginBottom: "24px",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e2e8f0",
  },
  uploadWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  uploadButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    background: "#6366f1",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "center",
  },

  fileName: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#1e293b",
    color: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: "clamp(80px, 15vw, 120px)",
    padding: "clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#1e293b",
    color: "#ffffff",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  previewImage: {
    width: "clamp(80px, 25vw, 120px)",
    height: "clamp(80px, 25vw, 120px)",
    objectFit: "cover",
    borderRadius: "12px",
    marginTop: "8px",
  },
  error: {
    color: "#fda4af",
    margin: 0,
    fontSize: "14px",
  },
  success: {
    color: "#86efac",
    margin: 0,
    fontSize: "14px",
  },
  uploadButton: {
    padding: "10px 18px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    transition: "0.2s",
  },

  fileName: {
    fontSize: "13px",
    color: "#cbd5e1",
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "4px",
  },
  linkButton: {
    marginTop: "16px",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
  },
};

export default ProfilePage;