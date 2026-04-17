import { useCallback, useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function CollaborationActivity() {
  const { messages, removeToast, toast } = useToast();
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      const res = await API.get("/admin/collaboration");
      setActivities(res.data);
    } catch (err) {
      toast.error("Failed to fetch activity");
    }
  }, [toast]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filteredActivities = activities.filter((activity) =>
    activity.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    activity.action?.toLowerCase().includes(search.toLowerCase()) ||
    activity.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">Collaboration Activity</h2>

        <div className="admin-search-box" style={{ marginBottom: "16px" }}>
          <input
            placeholder="Search collaboration activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card">
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
              {filteredActivities.length > 0 ? (
                filteredActivities.map(a => (
                  <tr key={a.id}>
                    <td>{a.userEmail}</td>
                    <td>{a.action}</td>
                    <td>{a.details}</td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No collaboration activity yet</td>
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

export default CollaborationActivity;
