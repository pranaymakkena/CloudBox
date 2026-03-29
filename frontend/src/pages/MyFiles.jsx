import { useEffect, useState, useMemo, useRef } from "react";
import { renderAsync } from "docx-preview";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import "../styles/style.css";
import "../components/layout/layout.css";
import "../components/common/card.css";

const CATEGORIES = ["All", "Documents", "Images", "Videos", "Audio", "Other"];

function getCategory(file) {
  const name = file.fileName?.toLowerCase() || "";
  const type = file.fileType?.toLowerCase() || "";
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "Images";
  if (type.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/.test(name)) return "Videos";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/.test(name)) return "Audio";
  if (type.includes("pdf") || type.includes("word") || type.includes("document") ||
      /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv)$/.test(name)) return "Documents";
  return "Other";
}

function getFileIcon(file) {
  const cat = getCategory(file);
  if (cat === "Images") return "fa-image";
  if (cat === "Videos") return "fa-film";
  if (cat === "Audio") return "fa-music";
  if (cat === "Documents") {
    if (/\.(pdf)$/i.test(file.fileName)) return "fa-file-pdf";
    if (/\.(doc|docx)$/i.test(file.fileName)) return "fa-file-word";
    if (/\.(xls|xlsx)$/i.test(file.fileName)) return "fa-file-excel";
    return "fa-file-lines";
  }
  return "fa-file";
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

function MyFiles() {
  const { messages, removeToast, toast } = useToast();
  const { query } = useSearch();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState(["root"]);
  const [shareEmail, setShareEmail] = useState({});
  const [sharePermission, setSharePermission] = useState({});
  const [moveFolder, setMoveFolder] = useState({});
  const [localSearch, setLocalSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewer, setViewer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [docxEditMode, setDocxEditMode] = useState(false);
  const [docxEditText, setDocxEditText] = useState("");
  const [docxSaving, setDocxSaving] = useState(false);
  const docxContainerRef = useRef(null);

  // merge header global search with local search
  const search = query || localSearch;

  const fetchFiles = async () => {
    try {
      const res = await API.get("/files");
      setFiles(res.data);
    } catch {
      toast.error("Failed to load files");
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await API.get("/files/folders");
      setFolders(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, []);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchSearch = f.fileName.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || getCategory(f) === category;
      return matchSearch && matchCat;
    });
  }, [files, search, category]);

  const deleteFile = async (id) => {
    try {
      await API.delete(`/files/${id}`);
      fetchFiles();
      toast.success("File deleted");
    } catch (err) {
      toast.error(err.response?.data || "Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  const downloadFile = async (id, name) => {
    try {
      const res = await API.get(`/files/download/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      link.click();
    } catch {
      toast.error("Download failed");
    }
  };

  const viewFile = async (file) => {
    const isDocx = /\.(doc|docx)$/i.test(file.fileName);
    if (isDocx) {
      try {
        const res = await API.get(`/files/preview/${file.id}`, { responseType: "arraybuffer" });
        setDocxEditMode(false);
        setDocxEditText("");
        setViewer({ type: "docx", name: file.fileName, fileId: file.id, arrayBuffer: res.data, isOwner: true });
      } catch {
        toast.error("Failed to open document");
      }
      return;
    }
    try {
      const res = await API.get(`/files/preview/${file.id}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = URL.createObjectURL(blob);
      setViewer({ url, type: blob.type, name: file.fileName });
    } catch {
      toast.error("Failed to open file");
    }
  };

  const startDocxEdit = async () => {
    if (!viewer?.fileId) return;
    try {
      const res = await API.get(`/files/docx-text/${viewer.fileId}`);
      setDocxEditText(res.data.text);
      setDocxEditMode(true);
    } catch {
      toast.error("Failed to load document text");
    }
  };

  const saveDocxEdit = async () => {
    if (!viewer?.fileId) return;
    setDocxSaving(true);
    try {
      await API.put(`/files/docx-text/${viewer.fileId}`, { text: docxEditText });
      toast.success("Document saved");
      // Refresh the preview
      const res = await API.get(`/files/preview/${viewer.fileId}`, { responseType: "arraybuffer" });
      setViewer((prev) => ({ ...prev, arrayBuffer: res.data }));
      setDocxEditMode(false);
    } catch (err) {
      toast.error(err.response?.data || "Failed to save document");
    } finally {
      setDocxSaving(false);
    }
  };

  // Render docx once viewer is set and ref is ready
  useEffect(() => {
    if (viewer?.type === "docx" && viewer.arrayBuffer && docxContainerRef.current) {
      docxContainerRef.current.innerHTML = "";
      renderAsync(viewer.arrayBuffer, docxContainerRef.current).catch(() =>
        toast.error("Failed to render document")
      );
    }
  }, [viewer]);

  const shareFile = async (fileId) => {
    const email = shareEmail[fileId]?.trim();
    const permission = sharePermission[fileId] || "VIEW";
    if (!email) { toast.warning("Enter recipient email"); return; }
    try {
      await API.post("/files/share", { fileId, sharedWith: email, permission });
      setShareEmail((prev) => ({ ...prev, [fileId]: "" }));
      toast.success("File shared successfully");
    } catch (err) {
      toast.error(err.response?.data || "Failed to share file");
    }
  };

  const moveFile = async (fileId) => {
    const targetFolder = moveFolder[fileId];
    if (!targetFolder) { toast.warning("Select a target folder"); return; }
    try {
      await API.put("/files/move", { fileId, targetFolder });
      fetchFiles();
      toast.success("File moved");
    } catch (err) {
      toast.error(err.response?.data || "Failed to move file");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2 className="page-heading">My Files</h2>

        {/* Search + Filter Bar */}
        <div className="files-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search files..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cat-tab ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="page-card">
          {filtered.length === 0 && (
            <p className="empty-msg">
              {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
            </p>
          )}

          {filtered.map((file) => (
            <div key={file.id} className="file-row">
              <div className="file-row-left">
                <i className={`fa-solid ${getFileIcon(file)} file-type-icon`}></i>
                <div>
                  <div className="file-row-name">{file.fileName}</div>
                  <div className="file-row-meta">
                    {formatSize(file.fileSize)} &bull; {file.folder || "root"} &bull;{" "}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="file-row-actions">
                <input
                  type="email"
                  placeholder="Share with email"
                  value={shareEmail[file.id] || ""}
                  onChange={(e) => setShareEmail((prev) => ({ ...prev, [file.id]: e.target.value }))}
                  className="inline-input"
                />
                <select
                  value={sharePermission[file.id] || "VIEW"}
                  onChange={(e) => setSharePermission((prev) => ({ ...prev, [file.id]: e.target.value }))}
                  className="inline-select"
                >
                  <option value="VIEW">View</option>
                  <option value="DOWNLOAD">Download</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => shareFile(file.id)}>Share</button>

                <select
                  value={moveFolder[file.id] || file.folder || "root"}
                  onChange={(e) => setMoveFolder((prev) => ({ ...prev, [file.id]: e.target.value }))}
                  className="inline-select"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>Move to {f}</option>
                  ))}
                </select>
                <button className="btn btn-warning btn-sm" onClick={() => moveFile(file.id)}>Move</button>

                <button className="btn btn-info btn-sm" onClick={() => viewFile(file)}>View</button>
                <button className="btn btn-success btn-sm" onClick={() => downloadFile(file.id, file.fileName)}>Download</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(file.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Inline confirm delete */}
        {confirmDelete && (
          <div className="viewer-modal" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Delete File?</h3>
              <p>This action cannot be undone.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => deleteFile(confirmDelete)}>Delete</button>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Viewer Modal */}
        {viewer && (
          <div className="viewer-modal" onClick={() => { setViewer(null); setDocxEditMode(false); }}>
            <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
              <div className="viewer-header">
                <span>{viewer.name}</span>
                <button className="close-btn" onClick={() => { setViewer(null); setDocxEditMode(false); }}>✕</button>
              </div>

              {viewer.type === "docx" && (
                <>
                  <div className="docx-toolbar">
                    <button
                      className={`docx-tab-btn${!docxEditMode ? " active" : ""}`}
                      onClick={() => setDocxEditMode(false)}
                    >
                      <i className="fa-solid fa-eye"></i> View
                    </button>
                    {viewer.isOwner && (
                      <button
                        className={`docx-tab-btn${docxEditMode ? " active" : ""}`}
                        onClick={startDocxEdit}
                      >
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                    )}
                    {docxEditMode && (
                      <button
                        className="docx-save-btn"
                        onClick={saveDocxEdit}
                        disabled={docxSaving}
                      >
                        {docxSaving
                          ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</>
                          : <><i className="fa-solid fa-floppy-disk"></i> Save</>
                        }
                      </button>
                    )}
                  </div>
                  {docxEditMode ? (
                    <textarea
                      className="docx-edit-textarea"
                      value={docxEditText}
                      onChange={(e) => setDocxEditText(e.target.value)}
                      spellCheck
                    />
                  ) : (
                    <div ref={docxContainerRef} className="docx-render-container" />
                  )}
                </>
              )}
              {viewer.type?.startsWith("image/") && (
                <img src={viewer.url} alt="preview" className="viewer-media" />
              )}
              {viewer.type === "application/pdf" && (
                <iframe src={viewer.url} className="viewer-frame" title={viewer.name} />
              )}
              {viewer.type?.startsWith("video/") && (
                <video controls className="viewer-media">
                  <source src={viewer.url} type={viewer.type} />
                </video>
              )}
              {viewer.type?.startsWith("audio/") && (
                <audio controls style={{ width: "100%", marginTop: "20px" }}>
                  <source src={viewer.url} type={viewer.type} />
                </audio>
              )}
              {viewer.type && viewer.type !== "docx" &&
                !viewer.type.startsWith("image/") &&
                viewer.type !== "application/pdf" &&
                !viewer.type.startsWith("video/") &&
                !viewer.type.startsWith("audio/") && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <p>Preview not available for this file type.</p>
                    <a href={viewer.url} download={viewer.name} className="btn btn-primary">Download</a>
                  </div>
                )}
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

export default MyFiles;
