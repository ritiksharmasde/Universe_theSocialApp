import React, { useState } from "react";
import { FiArrowLeft, FiUsers } from "react-icons/fi";
import API_BASE_URL from "./api";

function CreateGroupPage({ onBack, currentUserEmail, onGroupCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    course: "",
    year: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Group name is required.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required.";
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          course: formData.course,
          year: formData.year,
          createdByEmail: currentUserEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create group");
        return;
      }

      if (onGroupCreated) {
        onGroupCreated(data.group);
      } else if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error("Create group error:", error);
      alert("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={onBack}>
          <FiArrowLeft />
          <span>Back to Groups</span>
        </button>

        <div style={styles.headerRow}>
          <div style={styles.iconWrap}>
            <FiUsers />
          </div>
          <div>
            <h1 style={styles.title}>Create Group</h1>
            <p style={styles.subtitle}>
              Start a study community for your classmates and collaborate better.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Group Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. DBMS Masters"
              style={styles.input}
            />
            {errors.name ? <p style={styles.error}>{errors.name}</p> : null}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this group is for..."
              style={styles.textarea}
            />
            {errors.description ? (
              <p style={styles.error}>{errors.description}</p>
            ) : null}
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Course</label>
              <input
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. MCA"
                style={styles.input}
              />
              {errors.course ? <p style={styles.error}>{errors.course}</p> : null}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Year</label>
              <input
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. Year 1"
                style={styles.input}
              />
              {errors.year ? <p style={styles.error}>{errors.year}</p> : null}
            </div>
          </div>

          <button type="submit" style={styles.submitButton} disabled={submitting}>
            {submitting ? "Creating..." : "Create Group"}
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
    maxWidth: "760px",
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
  headerRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "24px",
  },
  iconWrap: {
    width: "clamp(40px, 12vw, 56px)",
  height: "clamp(40px, 12vw, 56px)",
  fontSize: "clamp(18px, 5vw, 24px)",
    borderRadius: "18px",
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: 0,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  row: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "clamp(10px, 3vw, 14px) 16px",
    fontSize: "15px",
    outline: "none",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  },
  textarea: {
    minHeight: "clamp(100px, 20vw, 140px)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "14px 16px",
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

export default CreateGroupPage;