import API from "../api/axiosConfig";

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Fetch available permissions for a file
 */
export const fetchAvailablePermissions = async (fileId) => {
    try {
        const response = await API.get(`/files/${fileId}/available-permissions`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch available permissions:", error);
        throw error;
    }
};

/**
 * Share file with granular permissions
 * recipients format: [{ email: "user@example.com", permission: "VIEW" }, ...]
 */
export const shareFileWithGranularPermissions = async (fileId, recipients) => {
    try {
        const response = await API.post("/files/share", {
            fileId,
            recipients,
        });
        return response.data;
    } catch (error) {
        console.error("Failed to share file:", error);
        throw error;
    }
};

/**
 * Check if email is already shared (from local state)
 */
export const isEmailAlreadyAdded = (email, recipients) => {
    return recipients.some((r) => r.email.toLowerCase() === email.toLowerCase());
};

/**
 * Get file type category for display
 */
export const getFileTypeCategory = (fileName = "") => {
    const n = fileName.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return "Image";
    if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return "Video";
    if (/\.(mp3|wav|ogg|flac|aac)$/.test(n)) return "Audio";
    if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/.test(n)) return "Document";
    return "File";
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + " " + sizes[i];
};
