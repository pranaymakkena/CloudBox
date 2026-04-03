import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminUsers() {
  const { messages, removeToast, toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [storageLimitInputs, setStorageLimitInputs] = useState({});

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
      const limits = {};
      res.data.forEach((user) => {
        limits[user.id] = user.storageLimitMb !== null && user.storageLimitMb !== undefined ? user.storageLimitMb : "";
      });
      setStorageLimitInputs(limits);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const toggleSuspend = async (user) => {
    try {
      setLoadingId(user.id);
      const url = user.suspended ? `/admin/unsuspend/${user.id}` : `/admin/suspend/${user.id}`;
      await API.put(url);
      fetchUsers();
      toast.success(user.suspended ? "User activated" : "User suspended");
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    try {
      await API.delete(`/admin/delete/${id}`);
      fetchUsers();
      toast.success("User deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const updateUserStorageLimit = async (user) => {
    const limitMb = Number(storageLimitInputs[user.id]);
    if (Number.isNaN(limitMb) || limitMb <= 0) {
      toast.warning("Enter a valid storage limit in MB");
      return;
    }

    try {
      setLoadingId(user.id);
      await API.put(`/admin/users/${user.id}/storage-limit`, { storageLimitMb: limitMb });
      await fetchUsers();
      toast.success(`Updated storage limit for ${user.email} to ${limitMb} MB`);
    } catch (err) {
      const errorMessage = err.response?.data || "Failed to update storage limit";
      toast.error(errorMessage);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">User Management</h2>

        <div className="user-grid">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <h3>{user.firstName} {user.lastName}</h3>
                <span className={`status-pill ${user.suspended ? 'status-suspended' : 'status-active'}`}>
                  {user.suspended ? 'Suspended' : 'Active'}
                </span>
              </div>

              <div className="user-card-body">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Location:</strong> {user.location || '—'}</p>
                <p><strong>Current Storage:</strong> {user.storageLimitMb || 15360} MB</p>

                <div className="storage-limit-group">
                  <label htmlFor={`limit-${user.id}`}>Set limit (MB)</label>
                  <input
                    id={`limit-${user.id}`}
                    type="number"
                    min="1"
                    step="1"
                    className="limit-input"
                    value={storageLimitInputs[user.id] ?? ""}
                    onChange={(e) => setStorageLimitInputs((prev) => ({ ...prev, [user.id]: e.target.value }))}
                    placeholder="e.g. 15360"
                  />
                </div>

                <div className="action-row">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={loadingId === user.id}
                    onClick={() => updateUserStorageLimit(user)}
                  >
                    {loadingId === user.id ? 'Updating...' : 'Update Limit'}
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    disabled={loadingId === user.id}
                    onClick={() => toggleSuspend(user)}
                  >
                    {user.suspended ? 'Activate' : 'Suspend'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="empty-state">
              <p>No users are visible yet.</p>
            </div>
          )}
        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminUsers;