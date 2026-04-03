import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import { triggerDownload, openInNewTab } from "../utils/fileAccess";
import "../styles/fileGrid.css";

function Media() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  // 🔥 Fetch files
  const fetchFiles = async () => {
    try {
      const res = await API.get("/files");

      const media = res.data.filter(f =>
        f.fileName?.match(/\.(jpg|jpeg|png|gif|mp4|mp3)$/i)
      );

      setFiles(media);
    } catch (err) {
      console.error("Error fetching files", err);
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Media</h2>

        <div className="file-grid">

          {files.map(file => (
            <div key={file.id} className="file-card">

              {/* IMAGE PREVIEW */}
              {file.fileName.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="file-thumb-wrapper">
                  <img
                    src={file.fileUrl || "/fallback-image.png"}
                    alt={file.fileName}
                    className="file-thumb"
                  />
                </div>
              ) : (
                <div className="file-icon">
                  <i className="fa-solid fa-film"></i>
                </div>
              )}

              <div className="file-name">{file.fileName}</div>

              <div className="file-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => file.fileUrl && openInNewTab(file.fileUrl)}
                >
                  View
                </button>

                <button
                  className="btn btn-success"
                  onClick={() => file.fileUrl && triggerDownload(file.fileUrl, file.fileName)}
                >
                  Download
                </button>
              </div>

            </div>
          ))}

        </div>
      </div>
    </Layout>
  );
}

export default Media;
