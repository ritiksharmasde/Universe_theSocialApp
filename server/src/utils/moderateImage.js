const axios = require("axios");
const FormData = require("form-data");

const moderateImage = async (file) => {
  try {
    if (!file || !file.buffer) {
      return {
        isSafe: false,
        reason: "Image moderation failed. No file buffer found.",
      };
    }

    const formData = new FormData();

    formData.append("media", file.buffer, {
      filename: file.originalname || "image.jpg",
      contentType: file.mimetype || "image/jpeg",
      knownLength: file.buffer.length,
    });

    formData.append("models", "nudity-2.1");
    formData.append("api_user", process.env.SIGHTENGINE_API_USER);
    formData.append("api_secret", process.env.SIGHTENGINE_API_SECRET);

    const response = await axios.post(
      "https://api.sightengine.com/1.0/check.json",
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 15000,
      }
    );

    const result = response.data || {};
    const nudity = result.nudity || {};

    console.log("SIGHTENGINE RESULT:", JSON.stringify(result, null, 2));

    const sexualActivity = Number(nudity.sexual_activity || 0);
    const sexualDisplay = Number(nudity.sexual_display || 0);
    const erotica = Number(nudity.erotica || 0);
    const verySuggestive = Number(nudity.very_suggestive || 0);
    const suggestive = Number(nudity.suggestive || 0);

    const shouldBlock =
      sexualActivity >= 0.15 ||
      sexualDisplay >= 0.15 ||
      erotica >= 0.20 ||
      verySuggestive >= 0.75 ||
      suggestive >= 0.98;

    if (shouldBlock) {
      return {
        isSafe: false,
        reason: "Inappropriate image detected",
      };
    }

    return { isSafe: true };
  } catch (error) {
    console.error("Moderation error:", error.response?.data || error.message);

    return {
      isSafe: false,
      reason: "Image moderation failed. Please try again.",
    };
  }
};

module.exports = moderateImage;
