import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../components/common/card.css";

function Notifications() {
  const { messages, removeToast, toast } = useToast();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/user/notifications");
      setNotifications(res.data);
    } catch (err) {
      toast.error("Failed to load notifications");
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/user/notifications/read-all");
      fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Notifications</h2>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button className="btn btn-primary" onClick={markAllRead}>
              Mark All Read
            </button>
          </div>

          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="list-item"
                style={{ opacity: notification.read ? 0.7 : 1 }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{notification.title}</strong>
                  <p style={{ margin: "6px 0" }}>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
                {!notification.read && (
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 600
                    }}
                  >
                    New
                  </span>
                )}
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

export default Notifications;
