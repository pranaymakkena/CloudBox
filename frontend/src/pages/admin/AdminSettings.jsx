import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminSettings() {
  const { messages, removeToast, toast } = useToast();
  const [storageLimit, setStorageLimit] = useState("");
  const [allowSignup, setAllowSignup] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await API.get("/admin/settings");
      setStorageLimit(res.data.storageLimit || 0);
      setAllowSignup(res.data.allowSignup);
    } catch (err) {
      toast.error("Failed to load settings");
    }
  };

  const saveSettings = async () => {
    try {
      const res = await API.post("/admin/settings", { storageLimit, allowSignup });
      setStorageLimit(res.data.storageLimit || 0);
      setAllowSignup(res.data.allowSignup);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data || "Failed to save");
    }
  };

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">System Settings</h2>

        <div className="card">

          <div className="settings-card">

            {/* STORAGE */}
            <div className="settings-group">
              <label>Storage Limit per User (MB) — 15360 = 15 GB</label>
              <input
                type="number"
                className="settings-input"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                placeholder="e.g. 15360 for 15 GB"
              />
            </div>

            {/* SIGNUP TOGGLE */}
            <div className="settings-group checkbox-group">
              <input
                type="checkbox"
                id="signup"
                checked={allowSignup}
                onChange={() => setAllowSignup(!allowSignup)}
              />
              <label htmlFor="signup">Allow New User Signup</label>
            </div>

            {/* SAVE BUTTON */}
            <button
              className="btn btn-success settings-btn"
              onClick={saveSettings}
            >
              Save Settings
            </button>

          </div>

        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminSettings;
