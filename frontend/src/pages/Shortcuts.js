import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import API from "../api/axiosConfig";
import "../styles/fileGrid.css";

function Shortcuts() {
  const [files, setFiles] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchShared();
  }, []);

  const fetchShared = async () => {
    try {
      const res = await API.get("/files/shared-with-me");
      setFiles(res.data);
    } catch (err) {
      console.error("Error fetching shared files", err);
    }
  };

  // 🔥 SAME OPEN FILE FUNCTION
  const openFile = async (url, isDownload = false, fileName = "file") => {
    try {
      const res = await fetch(`http://localhost:8080${url}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);

      if (isDownload) {
        const a = document.createElement("a");
        a.href = fileURL;
        a.download = fileName;
        a.click();
      } else {
        window.open(fileURL);
      }

    } catch {
      alert("Access denied");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared With Me</h2>

        <div className="file-grid">

          {files.map(file => (
            <div key={file.id} className="file-card">

              {/* FILE ICON BASED ON TYPE */}
              <div className="file-icon">
                {file.fileName.match(/\.(jpg|png|jpeg|gif)$/i) && (
                  <i className="fa-solid fa-image"></i>
                )}
                {file.fileName.match(/\.(mp4|mp3)$/i) && (
                  <i className="fa-solid fa-film"></i>
                )}
                {file.fileName.match(/\.(pdf)$/i) && (
                  <i className="fa-solid fa-file-pdf"></i>
                )}
                {file.fileName.match(/\.(doc|docx)$/i) && (
                  <i className="fa-solid fa-file-word"></i>
                )}
              </div>

              {/* FILE NAME */}
              <div className="file-name">{file.fileName}</div>

              {/* 🔥 OWNER INFO (important for shared UI) */}
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Shared by {file.ownerEmail}
              </div>

              {/* ACTIONS */}
              <div className="file-actions">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    openFile(`/api/files/preview/${file.id}`)
                  }
                >
                  View
                </button>

                <button
                  className="btn btn-success"
                  onClick={() =>
                    openFile(
                      `/api/files/download/${file.id}`,
                      true,
                      file.fileName
                    )
                  }
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

export default Shortcuts;