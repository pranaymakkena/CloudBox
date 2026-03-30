import { useEffect, useState, useMemo, useRef } from "react";
import { renderAsync } from "docx-preview";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import { getDirectFileUrl, triggerDownload } from "../utils/fileAccess";
import "../styles/fileGrid.css";

const CATEGORIES = ["All", "Documents", "Images", "Videos", "Audio", "Other"];

function getCategory(name = "", type = "") {
  const n = name.toLowerCase(), t = type.toLowerCase();
  if (t.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/.test(n)) return "Images";
  if (t.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/.test(n)) return "Videos";
  if (t.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/.test(n)) return "Audio";
  if (t.includes("pdf") || t.includes("word") || /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/.test(n)) return "Documents";
  return "Other";
}

function SharedWithMe() {
  const { messages, removeToast, toast } = useToast();
  const { query } = useSearch();
  const [shares, setShares] = useState([]);
  const [localSearch, setLocalSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewer, setViewer] = useState(null);
  const docxContainerRef = useRef(null);

  const search = query || localSearch;

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-with-me");
      setShares(res.data);
    } catch {
      toast.error("Failed to load shared files");
    }
  };

  const filtered = useMemo(() => {
    return shares.filter((s) => {
      const matchSearch = s.fileName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerEmail.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || getCategory(s.fileName, s.fileType || "") === category;
      return matchSearch && matchCat;
    });
  }, [shares, search, category]);

  const downloadFile = async (share) => {
    try {
      const directUrl = getDirectFileUrl(share);
      if (!directUrl) {
        throw new Error("Missing file URL");
      }
      triggerDownload(directUrl, share.fileName);
    } catch {
      toast.error("Download failed");
    }
  };

  const viewFile = async (share) => {
    const isDocx = /\.(doc|docx)$/i.test(share.fileName);
    if (isDocx) {
      try {
        const res = await API.get(`/files/preview/${share.fileId}`, { responseType: "arraybuffer" });
        setViewer({ type: "docx", name: share.fileName, arrayBuffer: res.data });
      } catch {
        toast.error("Failed to open document");
      }
      return;
    }
    try {
      const directUrl = getDirectFileUrl(share);
      if (!directUrl) {
        throw new Error("Missing file URL");
      }
      setViewer({ url: directUrl, type: share.fileType || "application/octet-stream", name: share.fileName });
    } catch {
      toast.error("Failed to open file");
    }
  };

  useEffect(() => {
    if (viewer?.type === "docx" && viewer.arrayBuffer && docxContainerRef.current) {
      docxContainerRef.current.innerHTML = "";
      renderAsync(viewer.arrayBuffer, docxContainerRef.current).catch(() =>
        toast.error("Failed to render document")
      );
    }
  }, [viewer]);

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared With Me</h2>

        {/* Toolbar */}
        <div className="files-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by name or owner..."
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

        <div className="file-grid">
          {filtered.length === 0 && (
            <p style={{ color: "#6b7280", gridColumn: "1/-1" }}>
              {shares.length === 0 ? "No files shared with you yet" : "No files match your search"}
            </p>
          )}

          {filtered.map((share) => (
            <div key={share.id} className="file-card">
              <div className="file-icon">
                {/\.(jpg|png|jpeg|gif)$/i.test(share.fileName) && <i className="fa-solid fa-image"></i>}
                {/\.(mp4|mp3)$/i.test(share.fileName) && <i className="fa-solid fa-film"></i>}
                {/\.(pdf)$/i.test(share.fileName) && <i className="fa-solid fa-file-pdf"></i>}
                {/\.(doc|docx)$/i.test(share.fileName) && <i className="fa-solid fa-file-word"></i>}
                {!/\.(jpg|png|jpeg|gif|mp4|mp3|pdf|doc|docx)$/i.test(share.fileName) && <i className="fa-solid fa-file"></i>}
              </div>
              <div className="file-name">{share.fileName}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{share.ownerEmail}</div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{share.permission}</div>
              <div className="file-actions">
                <button className="btn btn-primary" onClick={() => viewFile(share)}>View</button>
                <button
                  className="btn btn-success"
                  disabled={!share.canDownload}
                  onClick={() => downloadFile(share)}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Viewer Modal */}
        {viewer && (
          <div className="viewer-modal" onClick={() => setViewer(null)}>
            <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
              <div className="viewer-header">
                <span>{viewer.name}</span>
                <button className="close-btn" onClick={() => setViewer(null)}>✕</button>
              </div>
              {viewer.type === "docx" && (
                <div ref={docxContainerRef} className="docx-render-container" />
              )}
              {viewer.type?.startsWith("image/") && <img src={viewer.url} alt="preview" className="viewer-media" />}
              {viewer.type === "application/pdf" && <iframe src={viewer.url} className="viewer-frame" title={viewer.name} />}
              {viewer.type?.startsWith("video/") && (
                <video controls className="viewer-media"><source src={viewer.url} type={viewer.type} /></video>
              )}
              {viewer.type?.startsWith("audio/") && (
                <audio controls style={{ width: "100%", marginTop: "20px" }}>
                  <source src={viewer.url} type={viewer.type} />
                </audio>
              )}
              {viewer.type && viewer.type !== "docx" &&
                !viewer.type.startsWith("image/") && viewer.type !== "application/pdf" &&
                !viewer.type.startsWith("video/") && !viewer.type.startsWith("audio/") && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <p>Preview not available.</p>
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

export default SharedWithMe;
