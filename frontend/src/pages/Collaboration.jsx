import { useEffect, useState, useRef } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/collaboration.css";

const currentUser = localStorage.getItem("email") || "";

function getFileIcon(name) {
  const n = (name || "").toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return { icon: "fa-image",      color: "#0ea5e9" };
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return { icon: "fa-film",       color: "#8b5cf6" };
  if (/\.(mp3|wav|ogg|flac)$/.test(n))     return { icon: "fa-music",      color: "#ec4899" };
  if (/\.(pdf)$/.test(n))                  return { icon: "fa-file-pdf",   color: "#ef4444" };
  if (/\.(doc|docx)$/.test(n))             return { icon: "fa-file-word",  color: "#2563eb" };
  if (/\.(xls|xlsx)$/.test(n))             return { icon: "fa-file-excel", color: "#16a34a" };
  return                                          { icon: "fa-file-lines", color: "#6b7280" };
}

function getInitials(email) {
  return (email || "?").split("@")[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(email) {
  const p = ["#4285f4","#16a34a","#8b5cf6","#ec4899","#f59e0b","#0ea5e9","#ef4444"];
  let h = 0;
  for (let i = 0; i < (email||"").length; i++) h = (email.charCodeAt(i) + ((h << 5) - h)) | 0;
  return p[Math.abs(h) % p.length];
}

function relTime(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000)    return "just now";
  if (d < 3600000)  return Math.floor(d/60000)   + "m ago";
  if (d < 86400000) return Math.floor(d/3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

function Collaboration() {
  const { messages, removeToast, toast } = useToast();
  const [files,          setFiles]          = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [comments,       setComments]       = useState([]);
  const [message,        setMessage]        = useState("");
  const [search,         setSearch]         = useState("");
  const [sending,        setSending]        = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetchFiles(); }, []);

  useEffect(() => {
    if (selectedFileId) fetchComments(selectedFileId);
    else setComments([]);
  }, [selectedFileId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function fetchFiles() {
    try {
      const res = await API.get("/files/collaboration");
      setFiles(res.data);
      if (res.data.length > 0) setSelectedFileId(String(res.data[0].fileId));
    } catch {
      toast.error("Failed to load collaboration files");
    }
  }

  async function fetchComments(fileId) {
    try {
      const res = await API.get(`/files/collaboration/${fileId}/comments`);
      setComments(res.data);
    } catch {
      toast.error("Failed to load comments");
    }
  }

  async function sendComment() {
    if (!selectedFileId) { toast.warning("Select a file first"); return; }
    if (!message.trim()) return;
    setSending(true);
    try {
      await API.post("/files/collaboration/comment", {
        fileId: Number(selectedFileId),
        message: message.trim(),
      });
      setMessage("");
      fetchComments(selectedFileId);
    } catch (err) {
      toast.error(err.response?.data || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); }
  }

  const visibleFiles = files.filter(f => f.fileName.toLowerCase().includes(search.toLowerCase()));
  const selectedFile = files.find(f => String(f.fileId) === selectedFileId);
  const selFi = selectedFile ? getFileIcon(selectedFile.fileName) : { icon: "fa-file", color: "#6b7280" };

  return (
    <Layout type="user">
      <div className="content">

        <div className="cb-page-header">
          <div>
            <h2 className="page-heading" style={{ margin: 0 }}>Collaboration</h2>
            <p className="cb-page-sub">Discuss and comment on shared files</p>
          </div>
          <div className="cb-header-pills">
            <span className="cb-pill"><i className="fa-solid fa-file-circle-check"></i>{files.length} file{files.length !== 1 ? "s" : ""}</span>
            <span className="cb-pill"><i className="fa-solid fa-comments"></i>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="cb-empty-state">
            <div className="cb-empty-icon"><i className="fa-solid fa-users"></i></div>
            <h3>No collaboration files yet</h3>
            <p>Share a file with someone to start collaborating.</p>
          </div>
        ) : (
          <div className="cb-layout">

            <aside className="cb-sidebar">
              <div className="cb-sidebar-head">
                <span>Files</span>
                <span className="cb-count">{files.length}</span>
              </div>
              <div className="cb-sidebar-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="cb-file-list">
                {visibleFiles.map(file => {
                  const fi = getFileIcon(file.fileName);
                  const active = String(file.fileId) === selectedFileId;
                  return (
                    <div key={file.fileId} className={"cb-file-item" + (active ? " active" : "")} onClick={() => setSelectedFileId(String(file.fileId))}>
                      <div className="cb-file-icon" style={{ background: fi.color + "1a", color: fi.color }}>
                        <i className={"fa-solid " + fi.icon}></i>
                      </div>
                      <div className="cb-file-info">
                        <div className="cb-file-name">{file.fileName}</div>
                        <div className="cb-file-meta">{file.accessType === "OWNER" ? "You own this" : file.ownerEmail}</div>
                      </div>
                      <span className={"cb-tag " + (file.accessType === "OWNER" ? "tag-own" : "tag-shared")}>
                        {file.accessType === "OWNER" ? "Owner" : "Shared"}
                      </span>
                    </div>
                  );
                })}
                {visibleFiles.length === 0 && <p className="cb-no-results">No files found</p>}
              </div>
            </aside>

            <div className="cb-main">
              {selectedFile && (
                <div className="cb-info-bar">
                  <div className="cb-info-icon" style={{ background: selFi.color + "1a", color: selFi.color }}>
                    <i className={"fa-solid " + selFi.icon}></i>
                  </div>
                  <div className="cb-info-text">
                    <div className="cb-info-name">{selectedFile.fileName}</div>
                    <div className="cb-info-meta">Owner: <strong>{selectedFile.ownerEmail}</strong> &nbsp;·&nbsp; Permission: <strong>{selectedFile.permission}</strong></div>
                  </div>
                  <span className={"cb-perm " + (selectedFile.permission === "DOWNLOAD" ? "perm-dl" : "perm-view")}>
                    <i className={"fa-solid " + (selectedFile.permission === "DOWNLOAD" ? "fa-unlock" : "fa-eye")}></i>
                    {selectedFile.permission}
                  </span>
                </div>
              )}

              <div className="cb-messages">
                {comments.length === 0 ? (
                  <div className="cb-no-chat">
                    <div className="cb-no-chat-icon"><i className="fa-regular fa-comment-dots"></i></div>
                    <p>No comments yet</p>
                    <small>Be the first to start the conversation</small>
                  </div>
                ) : (
                  comments.map((c, idx) => {
                    const isMe = c.userEmail === currentUser;
                    const showHead = idx === 0 || comments[idx - 1].userEmail !== c.userEmail;
                    const avatarBg = getAvatarColor(c.userEmail);
                    return (
                      <div key={c.id} className={"cb-row " + (isMe ? "cb-row-me" : "cb-row-other")}>
                        {!isMe && (
                          <div className="cb-avatar" style={{ background: avatarBg, opacity: showHead ? 1 : 0 }}>
                            {getInitials(c.userEmail)}
                          </div>
                        )}
                        <div className="cb-group">
                          {showHead && !isMe && <div className="cb-sender">{c.userEmail}</div>}
                          <div className={"cb-bubble " + (isMe ? "cb-bubble-me" : "cb-bubble-other")}>{c.message}</div>
                          <div className={"cb-time" + (isMe ? " cb-time-me" : "")}>{relTime(c.createdAt)}</div>
                        </div>
                        {isMe && (
                          <div className="cb-avatar cb-avatar-me" style={{ background: avatarBg, opacity: showHead ? 1 : 0 }}>
                            {getInitials(c.userEmail)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="cb-composer">
                <div className="cb-composer-box">
                  <textarea
                    className="cb-composer-input"
                    rows={1}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Write a comment... (Enter to send)"
                  />
                  <button
                    className={"cb-send" + (message.trim() ? " cb-send-active" : "")}
                    onClick={sendComment}
                    disabled={sending || !message.trim()}
                  >
                    {sending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                  </button>
                </div>
                <div className="cb-hint">
                  <i className="fa-solid fa-circle-info"></i>
                  <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
                </div>
              </div>
            </div>

          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

export default Collaboration;
