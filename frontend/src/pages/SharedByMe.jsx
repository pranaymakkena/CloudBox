import { useEffect, useState, useMemo } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import "../components/common/card.css";
import "../styles/style.css";

const CATEGORIES = ["All", "Documents", "Images", "Videos", "Audio", "Other"];

function getCategory(name = "") {
  const n = name.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return "Images";
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return "Videos";
  if (/\.(mp3|wav|ogg|flac)$/.test(n)) return "Audio";
  if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/.test(n)) return "Documents";
  return "Other";
}

function SharedByMe() {
  const { messages, removeToast, toast } = useToast();
  const { query } = useSearch();
  const [shares, setShares] = useState([]);
  const [localSearch, setLocalSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const search = query || localSearch;

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-by-me");
      setShares(res.data);
    } catch (err) {
      toast.error("Failed to load shared records");
    }
  };

  const filtered = useMemo(() => {
    return shares.filter((s) => {
      const matchSearch =
        s.fileName.toLowerCase().includes(search.toLowerCase()) ||
        s.sharedWith.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || getCategory(s.fileName) === category;
      return matchSearch && matchCat;
    });
  }, [shares, search, category]);

  const revokeShare = async (id) => {
    try {
      await API.delete(`/files/shares/${id}`);
      fetchShares();
      toast.success("Share revoked");
    } catch (err) {
      toast.error(err.response?.data || "Failed to revoke share");
    } finally {
      setConfirmRevoke(null);
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared By Me</h2>

        {/* Toolbar */}
        <div className="files-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by file name or recipient..."
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

        <div className="card">
          {filtered.length === 0 && (
            <p style={{ color: "#6b7280" }}>
              {shares.length === 0 ? "No shared files yet" : "No files match your search"}
            </p>
          )}

          {filtered.map((share) => (
            <div key={share.id} className="list-item">
              <div style={{ flex: 1 }}>
                <strong>{share.fileName}</strong>
                <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                  Shared with: {share.sharedWith}
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Permission: {share.permission}
                </div>
              </div>
              <button className="btn btn-danger" onClick={() => setConfirmRevoke(share.id)}>
                Revoke
              </button>
            </div>
          ))}
        </div>

        {confirmRevoke && (
          <div className="viewer-modal" onClick={() => setConfirmRevoke(null)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Revoke Share?</h3>
              <p>The recipient will lose access to this file.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => revokeShare(confirmRevoke)}>Revoke</button>
                <button className="btn btn-secondary" onClick={() => setConfirmRevoke(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

export default SharedByMe;
