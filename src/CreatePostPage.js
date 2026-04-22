import API_BASE_URL from "./api";
import React, { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

function CreatePostPage({ onBack, onSubmitPost, profileData }) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formData, setFormData] = useState({
    type: "discussion",
    caption: "",
  });
  const [errors, setErrors] = useState({});

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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.type.trim()) {
      nextErrors.type = "Post type is required.";
    }

    if (!formData.caption.trim()) {
      nextErrors.caption = "Caption is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const postFormData = new FormData();
      
      postFormData.append("postType", formData.type);
      postFormData.append("caption", formData.caption);

      if (imageFile) {
        postFormData.append("image", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/user/create-post`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: postFormData,
});

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create post");
        return;
      }

      if (onSubmitPost) {
        onSubmitPost(data.post);
      }
    } catch (error) {
      console.error("Create post error:", error);
      alert("Server error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={onBack}>
          <FiArrowLeft />
          <span>Back to Feed</span>
        </button>

        <h1 style={styles.title}>Create Post</h1>
        <p style={styles.subtitle}>
          Share moments, doubts, notes, or discussion with your university
          community.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Post Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="discussion">Picture</option>
              <option value="doubt">Doubt</option>
              <option value="notes">Notes</option>
              <option value="discussion">Discussion</option>
            </select>
            {errors.type ? <p style={styles.error}>{errors.type}</p> : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Caption</label>
            <textarea
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              placeholder="Write your caption here..."
              style={styles.textarea}
            />
            {errors.caption ? <p style={styles.error}>{errors.caption}</p> : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Upload Image</label>

            <label style={styles.fileUploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={styles.hiddenFileInput}
              />

              <div style={styles.fileUploadContent}>
                <span style={styles.fileUploadButton}>Choose File</span>
                <span style={styles.fileUploadText}>
                  {imageFile ? imageFile.name : "No file selected"}
                </span>
              </div>
            </label>
          </div>

          {previewUrl ? (
            <div style={styles.previewBox}>
              <img src={previewUrl} alt="Post preview" style={styles.previewImage} />
            </div>
          ) : null}

          <button type="submit" style={styles.submitButton}>
            Publish Post
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "var(--bg-page)",
    padding: "clamp(10px, 3vw, 32px)",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    color: "var(--text-primary)",
  },
  card: {
    maxWidth: "720px",
    margin: "0 auto",
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "clamp(16px, 4vw, 28px)",
    boxSizing: "border-box",
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
    marginBottom: "20px",
    padding: 0,
  },
  title: {
    margin: "0 0 8px 0",
    padding: "clamp(22px, 6vw, 32px)",
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: "0 0 24px 0",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  hiddenFileInput: {
    display: "none",
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
  select: {
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "14px 16px",
    fontSize: "15px",
    outline: "none",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  },
  fileUploadText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
  },
  fileUploadButton: {
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "600",
  },
  fileUploadBox: {
    border: "1px dashed var(--border-color)",
    borderRadius: "16px",
    padding: "16px",
    background: "var(--bg-surface)",
    cursor: "pointer",
    transition: "0.2s ease",
  },
  fileUploadContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    width: "100%",
    minWidth: 0,
  },
  textarea: {
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "clamp(10px, 3vw, 14px) 16px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  },
  error: {
    margin: 0,
    fontSize: "13px",
    color: "#dc2626",
  },
  previewBox: {
    border: "1px solid var(--border-color)",
    borderRadius: "18px",
    overflow: "hidden",
    background: "var(--bg-surface-soft)",
  },
  previewImage: {
    width: "100%",
    maxHeight: "clamp(200px, 40vw, 360px)",
    objectFit: "cover",
    display: "block",
  },
  submitButton: {
    border: "none",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
};

export default CreatePostPage;
