import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../styles/folders.css";

function Folders() {

  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState("");

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
      alert(err.response?.data || "Failed");
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
    if (!window.confirm(`Delete "${name}"?`)) return;

    await API.delete(`/files/folders/${encodeURIComponent(name)}`);
    fetchFolders();
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
    </Layout>
  );
}

export default Folders;