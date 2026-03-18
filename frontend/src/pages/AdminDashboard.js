import { useEffect, useState } from "react";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ✅ Fetch users
  const fetchUsers = () => {
    fetch("http://localhost:8080/api/admin/users", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Suspend / Unsuspend toggle
  const toggleSuspend = (user) => {
    const url = user.suspended
      ? `/api/admin/unsuspend/${user.id}`
      : `/api/admin/suspend/${user.id}`;

    fetch("http://localhost:8080" + url, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
      },
    }).then(fetchUsers);
  };

  // ✅ Delete user
  const deleteUser = (id) => {
    if (!window.confirm("Delete user?")) return;

    fetch(`http://localhost:8080/api/admin/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    }).then(fetchUsers);
  };

  // ✅ Filter users
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <h3 style={{ textAlign: "center" }}>Loading users...</h3>;

  return (
    <div style={{ padding: "30px" }}>
      <h2 style={{ textAlign: "center" }}>Admin Dashboard</h2>

      {/* 🔍 Search */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* 📋 Table */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
      }}>
        <thead style={{ background: "#007bff", color: "white" }}>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map(user => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.firstName} {user.lastName}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.location}</td>
                <td style={tdStyle}>
                  {user.suspended ? "🔴 Suspended" : "🟢 Active"}
                </td>

                <td style={tdStyle}>
                  <button
                    onClick={() => toggleSuspend(user)}
                    style={{
                      marginRight: "10px",
                      background: user.suspended ? "#28a745" : "#ffc107",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    {user.suspended ? "Unsuspend" : "Suspend"}
                  </button>

                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ✅ styles
const thStyle = {
  padding: "12px",
  border: "1px solid #ddd",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

export default AdminDashboard;