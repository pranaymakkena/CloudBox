import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import { triggerDownload, openInNewTab } from "../utils/fileAccess";
import "../styles/fileGrid.css";

function Documents() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  // 📥 Fetch and filter documents
  const fetchFiles = async () => {
    try {
      const res = await API.get("/files");

      const docs = res.data.filter(f =>
        f.fileName?.match(/\.(pdf|doc|docx|txt|xls|xlsx)$/i)
      );

      setFiles(docs);

    } catch (err) {
      console.error("Error fetching documents", err);
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
