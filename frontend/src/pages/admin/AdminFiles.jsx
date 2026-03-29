import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminFiles() {
  const { messages, removeToast, toast } = useToast();
  const [files, setFiles] = useState([]);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    try {
      const res = await API.get("/admin/files");
      setFiles(res.data);
    } catch (err) {
      toast.error("Failed to fetch files");
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Delete file?")) return;
    try {
      await API.delete(`/admin/file/${id}`);
      fetchFiles();
      toast.success("File deleted");
    } catch (err) {
      toast.error("Delete failed");
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
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteFile(file.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminFiles;

const formatDate = (d) => new Date(d).toLocaleString();

const formatSize = (bytes) => {
  if (!bytes) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
};