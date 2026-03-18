import { logoutUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutUser(); // should clear token + role
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>CloudBox Dashboard</h1>

      <h3>Welcome, {user.sub || "User"} 👋</h3>
      <p>Role: {user.role}</p>

      <div style={{ marginTop: "20px" }}>
        {/* 👤 Profile */}
        <button onClick={() => navigate("/profile")}>
          My Profile
        </button>

        {/* 👑 Admin panel */}
        {user.role === "ADMIN" && (
          <button onClick={() => navigate("/admin")}>
            Admin Dashboard
          </button>
        )}

        {/* 🚪 Logout */}
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}