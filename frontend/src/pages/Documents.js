import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/layout/Layout";
import "../styles/fileGrid.css";

function Documents() {
  const [files, setFiles] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchFiles();
  }, []);

  // 📥 Fetch and filter documents
  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/files", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const docs = res.data.filter(f =>
        f.fileName?.match(/\.(pdf|doc|docx|txt|xls|xlsx)$/i)
      );

      setFiles(docs);

    } catch (err) {
      console.error("Error fetching documents", err);
    }
  };

  // 🔥 View / Download file (FIXED)
  const openFile = async (url, isDownload = false, fileName = "file") => {
    try {
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: "blob"
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"]
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

      // cleanup
      setTimeout(() => URL.revokeObjectURL(fileURL), 5000);

    } catch (err) {
      console.error(err);
      alert("Access denied or error loading file");
    }
  };

  // 📄 File icon based on type
  const getFileIcon = (fileName) => {
    if (fileName.match(/\.pdf$/i)) {
      return <i className="fa-solid fa-file-pdf"></i>;
    }
    if (fileName.match(/\.(doc|docx)$/i)) {
      return <i className="fa-solid fa-file-word"></i>;
    }
    if (fileName.match(/\.(xls|xlsx)$/i)) {
      return <i className="fa-solid fa-file-excel"></i>;
    }
    if (fileName.match(/\.txt$/i)) {
      return <i className="fa-solid fa-file-lines"></i>;
    }
    return <i className="fa-solid fa-file"></i>;
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Documents</h2>

        <div className="file-grid">

          {files.length > 0 ? (
            files.map(file => (
              <div key={file.id} className="file-card">

                {/* ICON */}
                <div className="file-icon">
                  {getFileIcon(file.fileName)}
                </div>

                {/* NAME */}
                <div className="file-name">{file.fileName}</div>

                {/* ACTIONS */}
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
            ))
          ) : (
            <p>No documents found</p>
          )}

        </div>
      </div>
    </Layout>
  );
}

export default Documents;