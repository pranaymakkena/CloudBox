import { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import {
    isValidEmail,
    fetchAvailablePermissions,
    shareFileWithGranularPermissions,
    isEmailAlreadyAdded,
    getFileTypeCategory,
    formatFileSize,
} from "../utils/fileShareUtils";
import "../styles/shareModal.css";

function ShareModal({ file, isOpen, onClose, onShareSuccess }) {
    const { toast } = useToast();
    const [recipients, setRecipients] = useState([]); // [{ email, permission }, ...]
    const [emailInput, setEmailInput] = useState("");
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [suggestedEmails, setSuggestedEmails] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [selectedPermissionForNew, setSelectedPermissionForNew] = useState("VIEW");

    // Fetch available permissions when file changes
    const loadAvailablePermissions = useCallback(async () => {
        try {
            const data = await fetchAvailablePermissions(file.id);
            setAvailablePermissions(data.availablePermissions || ["VIEW", "DOWNLOAD"]);
            // Set default permission to first available
            if (data.availablePermissions && data.availablePermissions.length > 0) {
                setSelectedPermissionForNew(data.availablePermissions[0]);
            }
        } catch (error) {
            toast.error("Failed to load available permissions");
        }
    }, [file.id, toast]);

    useEffect(() => {
        if (file && isOpen) {
            loadAvailablePermissions();
        }
    }, [file, isOpen, loadAvailablePermissions]);

    // Fetch suggested emails based on input
    const handleEmailInputChange = (e) => {
        const value = e.target.value.trim();
        setEmailInput(value);

        if (value.length > 2) {
            // In a real app, this would fetch from a user directory
            // For now, we'll show a placeholder
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setSuggestedEmails([]);
        }
    };

    const addRecipient = () => {
        const email = emailInput.trim();

        if (!email) {
            toast.warning("Enter an email address");
            return;
        }

        if (!isValidEmail(email)) {
            toast.error("Invalid email format");
            return;
        }

        if (isEmailAlreadyAdded(email, recipients)) {
            toast.warning("This email is already added");
            return;
        }

        if (email.toLowerCase() === localStorage.getItem("email")?.toLowerCase()) {
            toast.error("You cannot share a file with yourself");
            return;
        }

        setRecipients([
            ...recipients,
            { email, permission: selectedPermissionForNew },
        ]);
        setEmailInput("");
        setShowSuggestions(false);
        toast.success(`Added ${email}`);
    };

    const removeRecipient = (index) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const updateRecipientPermission = (index, newPermission) => {
        const updated = [...recipients];
        updated[index].permission = newPermission;
        setRecipients(updated);
    };

    const handleShare = async () => {
        if (recipients.length === 0) {
            toast.warning("Add at least one recipient");
            return;
        }

        setIsSharing(true);
        try {
            await shareFileWithGranularPermissions(file.id, recipients);
            toast.success(
                `Shared with ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`
            );
            setRecipients([]);
            setEmailInput("");
            onShareSuccess?.();
            onClose();
        } catch (error) {
            const errorMsg =
                error.response?.data || error.message || "Failed to share file";
            toast.error(errorMsg);
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="share-modal-header">
                    <div className="share-modal-file-info">
                        <div className="share-modal-file-icon">
                            {getFileTypeCategory(file.fileName) === "Image" && (
                                <i className="fa-solid fa-image"></i>
                            )}
                            {getFileTypeCategory(file.fileName) === "Document" && (
                                <i className="fa-solid fa-file-word"></i>
                            )}
                            {getFileTypeCategory(file.fileName) === "Video" && (
                                <i className="fa-solid fa-video"></i>
                            )}
                            {getFileTypeCategory(file.fileName) === "Audio" && (
                                <i className="fa-solid fa-music"></i>
                            )}
                            {getFileTypeCategory(file.fileName) === "File" && (
                                <i className="fa-solid fa-file"></i>
                            )}
                        </div>
                        <div>
                            <h3>{file.fileName}</h3>
                            <p className="share-modal-file-meta">
                                {getFileTypeCategory(file.fileName)} • {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>
                    <button className="share-modal-close" onClick={onClose}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Add Recipient Section */}
                <div className="share-modal-add-recipient">
                    <label>Add Recipients</label>
                    <div className="share-modal-input-group">
                        <input
                            type="email"
                            placeholder="Enter email address"
                            value={emailInput}
                            onChange={handleEmailInputChange}
                            onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                            className="share-modal-email-input"
                        />
                        <select
                            value={selectedPermissionForNew}
                            onChange={(e) => setSelectedPermissionForNew(e.target.value)}
                            className="share-modal-permission-select"
                        >
                            {availablePermissions.map((perm) => (
                                <option key={perm} value={perm}>
                                    {perm}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={addRecipient}
                            className="share-modal-add-btn"
                            disabled={!emailInput.trim()}
                        >
                            <i className="fa-solid fa-plus"></i> Add
                        </button>
                    </div>
                    {showSuggestions && suggestedEmails.length > 0 && (
                        <div className="share-modal-suggestions">
                            {suggestedEmails.map((email) => (
                                <div
                                    key={email}
                                    className="share-modal-suggestion-item"
                                    onClick={() => {
                                        setEmailInput(email);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {email}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recipients List */}
                <div className="share-modal-recipients">
                    <label>Recipients ({recipients.length})</label>
                    {recipients.length === 0 ? (
                        <p className="share-modal-empty-message">
                            No recipients added yet
                        </p>
                    ) : (
                        <div className="share-modal-recipients-list">
                            {recipients.map((recipient, index) => (
                                <div key={index} className="share-modal-recipient-item">
                                    <div className="share-modal-recipient-email">
                                        <i className="fa-solid fa-user-circle"></i>
                                        <span>{recipient.email}</span>
                                    </div>
                                    <div className="share-modal-recipient-actions">
                                        <select
                                            value={recipient.permission}
                                            onChange={(e) =>
                                                updateRecipientPermission(index, e.target.value)
                                            }
                                            className="share-modal-recipient-permission"
                                        >
                                            {availablePermissions.map((perm) => (
                                                <option key={perm} value={perm}>
                                                    {perm}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => removeRecipient(index)}
                                            className="share-modal-remove-btn"
                                            title="Remove recipient"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="share-modal-footer">
                    <button onClick={onClose} className="share-modal-cancel-btn">
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className="share-modal-share-btn"
                        disabled={recipients.length === 0 || isSharing}
                    >
                        {isSharing ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i> Sharing...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-share-alt"></i> Share
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
