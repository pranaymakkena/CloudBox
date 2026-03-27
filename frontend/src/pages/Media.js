import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/layout/Layout";
import "../styles/fileGrid.css";

function Media() {
  const [files, setFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchFiles();
  }, []);

  // 🔥 Fetch files
  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const media = res.data.filter(f =>
        f.fileName?.match(/\.(jpg|jpeg|png|gif|mp4|mp3)$/i)
      );

      setFiles(media);

      // 🔥 Load images securely
      media.forEach(file => {
        if (file.fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
          loadImage(file.id);
        }
      });

    } catch (err) {
      console.error("Error fetching files", err);
    }
  };

  // 🔥 Load image with JWT
  const loadImage = async (fileId) => {
  try {
    const res = await axios.get(
      `http://localhost:8080/api/files/preview/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      }
    );

    const blob = new Blob([res.data], {
      type: res.headers["content-type"] // 🔥 IMPORTANT
    });

    const url = URL.createObjectURL(blob);

    setImageUrls(prev => ({ ...prev, [fileId]: url }));

  } catch {
    setImageUrls(prev => ({
      ...prev,
      [fileId]: "/fallback-image.png"
    }));
  }
};

  // 🔥 Open file (view/download)
  const openFile = async (url, isDownload = false, fileName = "file") => {
  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob"
    });

    const blob = new Blob([res.data], {
      type: res.headers["content-type"] // 🔥 FIX
    });

    const fileURL = window.URL.createObjectURL(blob);

    if (isDownload) {
      const a = document.createElement("a");
      a.href = fileURL;
      a.download = fileName;
      a.click();
    } else {
      window.open(fileURL);
    }

  } catch (err) {
    console.error(err);
    alert("Access denied or error loading file");
  }
};

  // 🔥 Cleanup memory
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

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
                    src={imageUrls[file.id]}
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
                  onClick={() =>
                    openFile(
                      `http://localhost:8080/api/files/preview/${file.id}`
                    )
                  }
                >
                  View
                </button>

                <button
                  className="btn btn-success"
                  onClick={() =>
                    openFile(
                      `http://localhost:8080/api/files/download/${file.id}`,
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

export default Media;