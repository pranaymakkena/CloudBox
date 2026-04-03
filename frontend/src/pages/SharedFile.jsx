import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { renderAsync } from "docx-preview";
import axios from "axios";
import "../styles/style.css";
import "../styles/SharedFile.css";

const BASE = "http://localhost:8080/api";

export default function SharedFile() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const docxRef = useRef(null);

  useEffect(() => {
    axios.get(`${BASE}/public/info/${token}`)
      .then(res => {
        setInfo(res.data);
        loadPreview(res.data);
      })
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  async function loadPreview(fileInfo) {
    const isDocx = /\.(doc|docx)$/i.test(fileInfo.fileName);
    const isImage = fileInfo.fileType?.startsWith("image/");
    const isPdf = fileInfo.fileType === "application/pdf";
    const isVideo = fileInfo.fileType?.startsWith("video/");
    const isAudio = fileInfo.fileType?.startsWith("audio/");

    if (isDocx) {
      try {
        const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "arraybuffer" });
        if (docxRef.current) {
          docxRef.current.innerHTML = "";
          renderAsync(res.data, docxRef.current);
        }
      } catch {}
      return;
    }

    if (isImage || isPdf || isVideo || isAudio) {
      try {
        const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "blob" });
        setPreviewUrl(URL.createObjectURL(new Blob([res.data], { type: fileInfo.fileType })));
      } catch {}
    }
  }

  async function download() {
    try {
      const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = info.fileName;
      a.click();
    } catch {
      alert("Download failed");
    }
  }

  if (loading) return (
    <div className="sf-page">
      <div className="sf-card">
        <div className="sf-loading"><i className="fa-solid fa-spinner fa-spin"></i> Loading…</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sf-page">
      <div className="sf-card sf-error-card">
        <i className="fa-solid fa-circle-xmark sf-error-icon"></i>
        <h2>Link Unavailable</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  const isDocx = /\.(doc|docx)$/i.test(info.fileName);
  const isImage = info.fileType?.startsWith("image/");
  const isPdf = info.fileType === "application/pdf";
  const isVideo = info.fileType?.startsWith("video/");
  const isAudio = info.fileType?.startsWith("audio/");
  const canDownload = info.permission === "DOWNLOAD";

  return (
    <div className="sf-page">
      <div className="sf-card">
        <div className="sf-header">
          <div className="sf-logo">☁ CloudBox</div>
          <div className="sf-meta">
            <div className="sf-filename">{info.fileName}</div>
            <span className={`share-perm-badge perm-${info.permission?.toLowerCase()}`}>
              {info.permission}
            </span>
          </div>
          {canDownload && (
            <button className="btn btn-primary" onClick={download}>
              <i className="fa-solid fa-download"></i> Download
            </button>
          )}
        </div>

        <div className="sf-preview">
          {isDocx && <div ref={docxRef} className="docx-render-container" />}
          {isImage && previewUrl && <img src={previewUrl} alt={info.fileName} className="sf-img" />}
          {isPdf && previewUrl && <iframe src={previewUrl} className="sf-frame" title={info.fileName} />}
          {isVideo && previewUrl && (
            <video controls className="sf-video">
              <source src={previewUrl} type={info.fileType} />
            </video>
          )}
          {isAudio && previewUrl && (
            <audio controls className="sf-audio">
              <source src={previewUrl} type={info.fileType} />
            </audio>
          )}
          {!isDocx && !isImage && !isPdf && !isVideo && !isAudio && (
            <div className="sf-no-preview">
              <i className="fa-solid fa-file sf-file-icon"></i>
              <p>Preview not available for this file type.</p>
              {canDownload && (
                <button className="btn btn-primary" onClick={download}>Download to view</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
