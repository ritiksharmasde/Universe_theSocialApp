import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiEdit2, FiSave, FiX } from "react-icons/fi";
import API_BASE_URL, { SERVER_BASE_URL } from "./api";
function ProfileDetailsPage({ profileData, email, onBack, onSaveProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePreview, setProfilePreview] = useState("");
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  const styles = getStyles(isMobile, isTablet);
  const [formData, setFormData] = useState({
    fullName: profileData?.fullName || "",
    username: profileData?.username || "",
    email: email || profileData?.email || "",
    course: profileData?.course || "",
    year: profileData?.year || "",
    branch: profileData?.branch || "",
    bio: profileData?.bio || "",
    interests: profileData?.interests || "",
    skills: profileData?.skills || "",
    city: profileData?.city || "",
    linkedin: profileData?.linkedin || "",
    github: profileData?.github || "",
    profileImage: profileData?.profileImage || "",
  });

  const [errors, setErrors] = useState({});
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);

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

  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setSelectedProfileFile(file);
    setProfilePreview(previewUrl);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "University email is required.";
    } else if (!/^[a-zA-Z]+\.[0-9]+@stu\.upes\.ac\.in$/.test(formData.email)) {
      nextErrors.email = "Use a valid university email.";
    }

    if (!formData.course.trim()) {
      nextErrors.course = "Course is required.";
    }

    if (!formData.year.trim()) {
      nextErrors.year = "Year is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const uploadProfileImage = async () => {
    if (!selectedProfileFile) return formData.profileImage || "";

    const imageFormData = new FormData();
    imageFormData.append("image", selectedProfileFile);
    

    const response = await fetch(`${API_BASE_URL}/user/upload-profile-image`, {
      method: "POST",
      headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
      body: imageFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image upload failed");
    }

    return data.imageUrl
      ? data.imageUrl.startsWith("http")
        ? data.imageUrl
        : `${SERVER_BASE_URL}${data.imageUrl}`
      : "";
  };
useEffect(() => {
  const fetchMyProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) return;

      const user = data.user;

      setFormData({
        fullName: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        course: user.course || "",
        year: user.year || "",
        branch: user.branch || "",
        bio: user.bio || "",
        interests: user.interests || "",
        skills: user.skills || "",
        city: user.city || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        profileImage: user.profile_image_url || "",
      });
    } catch (error) {
      console.error("fetchMyProfile error:", error);
    }
  };

  fetchMyProfile();
}, []);
  const handleSave = async () => {
  if (!validateForm()) return;

  try {
    let finalProfileImage = formData.profileImage || "";

    if (selectedProfileFile) {
      finalProfileImage = await uploadProfileImage();
    }

    const response = await fetch(`${API_BASE_URL}/user/save-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        fullName: formData.fullName,
        username: formData.username,
        course: formData.course,
        year: formData.year,
        branch: formData.branch,
        bio: formData.bio,
        interests: formData.interests,
        skills: formData.skills,
        city: formData.city,
        linkedin: formData.linkedin,
        github: formData.github,
        profileImage: finalProfileImage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save profile");
    }

    setSelectedProfileFile(null);
    setIsEditing(false);

  } catch (error) {
    console.error("Save error:", error);
    alert(error.message);
  }
};
  const handleCancel = () => {
    setFormData({
      fullName: profileData?.fullName || "",
      username: profileData?.username || "",
      email: email || profileData?.email || "",
      course: profileData?.course || "",
      year: profileData?.year || "",
     branch: profileData?.branch || "",
      bio: profileData?.bio || "",
      interests: profileData?.interests || "",
      skills: profileData?.skills || "",
      city: profileData?.city || "",
      linkedin: profileData?.linkedin || "",
      github: profileData?.github || "",
      profileImage: profileData?.profileImage || "",
    });
    setErrors({});
    setSelectedProfileFile(null);
    setIsEditing(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button style={styles.backButton} onClick={onBack}>
          <FiArrowLeft />
          <span>Back</span>
        </button>

        <div style={styles.headerCard}>
          <div style={styles.profileTop}>
            <div style={styles.profileImageSection}>
              <img
  src={
    profilePreview
      ? profilePreview
      : formData.profileImage
      ? formData.profileImage
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || "User")}`
  }
  alt={formData.fullName || "Profile"}
  style={styles.profileImage}
/>


              {isEditing && (
                <label style={styles.uploadLabel}>
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    style={styles.hiddenFileInput}
                  />
                </label>
              )}
            </div>

            <div style={styles.profileIntro}>
              <h1 style={styles.name}>{formData.fullName || "Student Name"}</h1>
              <p style={styles.username}>@{formData.username || "username"}</p>
              <p style={styles.meta}>
                {formData.course || "Course"} • Year {formData.year || "-"}
               {formData.branch ? ` • Branch ${formData.branch}` : ""}
              </p>

              <div style={styles.headerButtons}>
                {!isEditing ? (
                  <button
                    style={styles.primaryButton}
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit2 />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button style={styles.primaryButton} onClick={handleSave}>
                      <FiSave />
                      <span>Save</span>
                    </button>
                    <button
                      style={styles.secondaryButton}
                      onClick={handleCancel}
                    >
                      <FiX />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Basic Details</h2>

            <ProfileField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              isEditing={isEditing}
              onChange={handleChange}
              error={errors.fullName}
              styles={styles}
            />

            <ProfileField
              label="Username"
              name="username"
              value={formData.username}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}


            />

            <ProfileField
              label="University Email"
              name="email"
              value={formData.email}
              isEditing={isEditing}
              onChange={handleChange}
              error={errors.email}
              styles={styles}

            />

            <ProfileField
              label="Course"
              name="course"
              value={formData.course}
              isEditing={isEditing}
              onChange={handleChange}
              error={errors.course}
              styles={styles}

            />

            <ProfileField
              label="Year"
              name="year"
              value={formData.year}
              isEditing={isEditing}
              onChange={handleChange}
              error={errors.year}
              styles={styles}
            />

           <ProfileField
  label="Branch"
  name="branch"
  value={formData.branch}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}
            />
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>About</h2>

            <TextAreaField
              label="Bio"
              name="bio"
              value={formData.bio}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}
            />

            <ProfileField
              label="Interests"
              name="interests"
              value={formData.interests}
              isEditing={isEditing}
              onChange={handleChange}
              placeholder="AI, design, coding, public speaking"
              styles={styles}
            />

            <ProfileField
              label="Skills"
              name="skills"
              value={formData.skills}
              isEditing={isEditing}
              onChange={handleChange}
              placeholder="React, JavaScript, UI design"
              styles={styles}
            />

            <ProfileField
              label="City"
              name="city"
              value={formData.city}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}
            />
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Links</h2>

            <ProfileField
              label="LinkedIn"
              name="linkedin"
              value={formData.linkedin}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}

            />

            <ProfileField
              label="GitHub"
              name="github"
              value={formData.github}
              isEditing={isEditing}
              onChange={handleChange}
              styles={styles}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  name,
  value,
  isEditing,
  onChange,
  error,
  placeholder,
  styles,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {isEditing ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          style={styles.input}
        />
      ) : (
        <div style={styles.readOnlyValue}>{value || "-"}</div>
      )}
      {error ? <p style={styles.error}>{error}</p> : null}
    </div>
  );
}

function TextAreaField({ label, name, value, isEditing, onChange, styles }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {isEditing ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          style={styles.textarea}
        />
      ) : (
        <div style={styles.readOnlyBio}>{value || "-"}</div>
      )}
    </div>
  );
}

const getStyles = (isMobile, isTablet) => ({
  profileImageSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  uploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  hiddenFileInput: {
    display: "none",
  },
  page: {
    minHeight: "100dvh",
    background: "transparent",
    padding: "clamp(10px, 3vw, 24px)",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    color: "var(--text-primary)",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  backButton: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "var(--text-primary)",
    fontSize: "14px",
    marginBottom: "18px",
    padding: 0,
  },
  headerCard: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  profileTop: {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "center" : "flex-start",
    gap: "24px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  profileImage: {
    width: "clamp(80px, 25vw, 120px)",
    height: "clamp(80px, 25vw, 120px)",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--border-color)",
  },
  profileIntro: {
    flex: 1,
  },
  name: {
    margin: "0 0 6px 0",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--text-primary)",
  },
  username: {
    margin: "0 0 8px 0",
    color: "var(--text-secondary)",
    fontSize: "15px",
  },
  meta: {
    margin: "0 0 16px 0",
    color: "var(--text-secondary)",
    fontSize: "15px",
  },
  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryButton: {
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface-soft)",
    color: "var(--text-primary)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    alignItems: "start",
  },
  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "var(--text-primary)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  input: {
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: isMobile ? "10px 12px" : "14px 16px",
    fontSize: "15px",
    outline: "none",
    background: "var(--bg-surface-soft)",
    color: "var(--text-primary)",
  },
  textarea: {
    minHeight: "120px",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    background: "var(--bg-surface-soft)",
    color: "var(--text-primary)",
  },
  readOnlyValue: {
    minHeight: "20px",
    padding: "10px 0",
    color: "var(--text-secondary)",
  },
  readOnlyBio: {
    minHeight: "80px",
    padding: "10px 0",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  error: {
    margin: 0,
    fontSize: "13px",
    color: "#dc2626",
  },
});
export default ProfileDetailsPage;
