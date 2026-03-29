import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/folders.css";

function Folders() {
  const { messages, removeToast, toast } = useToast();
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState("");
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const res = await API.get("/files/folders");
    setFolders(res.data);
  };

  const createFolder = async () => {
    if (!newFolder.trim()) return;

    try {
      await API.post("/files/folders", { name: newFolder });
      setNewFolder("");
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data || "Failed");
    }
  };

  const renameFolder = async (oldName) => {
    const newName = window.prompt("Rename folder", oldName);
    if (!newName || newName === oldName) return;

    await API.put("/files/folders/rename", { oldName, newName });
    fetchFolders();
  };

  const deleteFolder = async (name) => {
    if (name === "root") return;
    setConfirmDeleteFolder(name);
  };

  const confirmDeleteFolderAction = async (name) => {
    try {
      await API.delete(`/files/folders/${encodeURIComponent(name)}`);
      fetchFolders();
      toast.success(`Folder "${name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data || "Failed to delete folder");
    } finally {
      setConfirmDeleteFolder(null);
    }
  };

  return (
    <Layout type="user">
      <div className="folders-container">

        {/* HEADER */}
        <div className="folders-header">
          <h2>📁 My Folders</h2>

          <div className="folder-create">
            <input
              type="text"
              placeholder="Create new folder..."
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
            />
            <button onClick={createFolder}>+ Create</button>
          </div>
        </div>

        {/* GRID */}
        <div className="folders-grid">
          {folders.map((folder) => (
            <div key={folder} className="folder-card">

              <div className="folder-icon">📁</div>

              <div className="folder-name">{folder}</div>

              {folder !== "root" && (
                <div className="folder-actions">
                  <button onClick={() => renameFolder(folder)}>✏️</button>
                  <button onClick={() => deleteFolder(folder)}>🗑</button>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>

      {confirmDeleteFolder && (
        <div className="viewer-modal" onClick={() => setConfirmDeleteFolder(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
            <h3>Delete Folder?</h3>
            <p>Delete "{confirmDeleteFolder}" and all its files?</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={() => confirmDeleteFolderAction(confirmDeleteFolder)}>Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteFolder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default Folders;