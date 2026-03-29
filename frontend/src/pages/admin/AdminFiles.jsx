import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import "../../styles/style.css";

function AdminFiles() {
  const { messages, removeToast, toast } = useToast();
  const [files, setFiles] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    try {
      const res = await API.get("/admin/files");
      setFiles(res.data);
    } catch {
      toast.error("Failed to fetch files");
    }
  };

  const deleteFile = async (id) => {
    try {
      await API.delete(`/admin/file/${id}`);
      fetchFiles();
      toast.success("File deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <Layout type="admin">
      <div className="content">
        <h2 className="dashboard-title">File Management</h2>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Owner</th>
                <th>Size</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td>{file.fileName}</td>
                  <td>{file.userEmail}</td>
                  <td>{formatSize(file.size)}</td>
                  <td>{formatDate(file.createdAt)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(file.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "#9baabf" }}>No files found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="viewer-modal" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
            <h3>Delete File?</h3>
            <p>This will permanently remove the file and cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={() => deleteFile(confirmDelete)}>Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminFiles;

const formatDate = (d) => new Date(d).toLocaleString();
const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
};
