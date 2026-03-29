import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminLogs() {
  const { messages, removeToast, toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get("/admin/logs");
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to fetch logs");
    }
  };

  // 🔍 filter logs
  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">System Logs</h2>

        {/* SEARCH */}
        <div className="admin-search-box">
          <input
            placeholder="Search logs (action / email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LOG TABLE */}
        <div className="card">

          <div className="card-title">Activity Logs</div>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.userEmail || "System"}</td>

                    <td>
                      <span className={`log-badge ${getActionClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td>{log.details}</td>

                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No logs found</td>
                </tr>
              )}
            </tbody>

          </table>

        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminLogs;


// ================= HELPERS =================

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const getActionClass = (action) => {
  if (!action) return "";

  if (action.includes("DELETE")) return "danger";
  if (action.includes("SUSPEND")) return "warning";
  if (action.includes("UPLOAD")) return "success";

  return "info";
};