import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminNotifications() {
  const { messages, removeToast, toast } = useToast();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/admin/notifications");
      setNotifications(res.data);
    } catch (err) {
      toast.error("Failed to load notifications");
    }
  };

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">Notifications</h2>

        <div className="card">

          {notifications.length > 0 ? (
            notifications.map(n => (
              <div key={n.id} className="list-item">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No notifications</p>
          )}

        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminNotifications;