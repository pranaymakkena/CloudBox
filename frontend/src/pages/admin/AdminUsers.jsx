import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminUsers() {
  const { messages, removeToast, toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
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

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">User Management</h2>

        <div className="card">

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.location}</td>

                  {/* STATUS */}
                  <td style={{ color: user.suspended ? "red" : "green" }}>
                    {user.suspended ? "Suspended" : "Active"}
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <button
                      className="btn btn-warning"
                      disabled={loadingId === user.id}
                      onClick={() => toggleSuspend(user)}
                    >
                      {loadingId === user.id
                        ? "Processing..."
                        : user.suspended
                          ? "Activate"
                          : "Suspend"}
                    </button>

                    <button
                      className="btn btn-danger"
                      style={{ marginLeft: "8px" }}
                      onClick={() => deleteUser(user.id)}
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

export default AdminUsers;