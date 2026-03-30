import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/style.css";
import "../styles/Profile.css";

function Profile() {
  const { messages, removeToast, toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);

  const name = localStorage.getItem("name") || "User";
  const role = localStorage.getItem("role") || "USER";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile");
      setUser(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const updateProfile = async () => {
    try {
      await API.put("/user/profile", user);
      toast.success("Profile updated!");
      setEdit(false);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fields = [
    { label: "First Name", name: "firstName", type: "text" },
    { label: "Last Name", name: "lastName", type: "text" },
    { label: "Email", name: "email", type: "text", readOnly: true },
    { label: "Gender", name: "gender", type: "select", options: ["MALE", "FEMALE", "OTHER"] },
    { label: "Age", name: "age", type: "number" },
    { label: "Location", name: "location", type: "text" },
  ];

  return (
    <Layout type="user">
      <div className="content">
        <div className="prf-page">

          {/* ── LEFT: avatar card ── */}
          <div className="prf-sidebar">
            <div className="prf-avatar-wrap">
              <div className="prf-avatar">{initials}</div>
              <div className="prf-avatar-ring" />
            </div>
            <h3 className="prf-name">{user.firstName} {user.lastName}</h3>
            <span className="prf-role-badge">{role === "ADMIN" ? "Administrator" : "Member"}</span>
            <p className="prf-email">{user.email}</p>

            <div className="prf-sidebar-actions">
              {!edit && (
                <button className="btn btn-primary prf-btn" onClick={() => setEdit(true)}>
                  <i className="fa-solid fa-pen" /> Edit Profile
                </button>
              )}
              <button className="prf-logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket" />
                Sign Out
              </button>
            </div>
          </div>

          {/* ── RIGHT: details card ── */}
          <div className="prf-card">
            <div className="prf-card-header">
              <h2 className="prf-card-title">Profile Details</h2>
              {edit && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-success btn-sm" onClick={updateProfile}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEdit(false)}>Cancel</button>
                </div>
              )}
            </div>

            <div className="prf-fields">
              {fields.map(f => (
                <div className="prf-field" key={f.name}>
                  <label className="prf-label">{f.label}</label>
                  {edit && !f.readOnly ? (
                    f.type === "select" ? (
                      <select className="prf-input" name={f.name} value={user[f.name] || ""} onChange={handleChange}>
                        <option value="">Select</option>
                        {f.options.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
                      </select>
                    ) : (
                      <input className="prf-input" type={f.type} name={f.name} value={user[f.name] || ""} onChange={handleChange} />
                    )
                  ) : (
                    <span className="prf-value">{user[f.name] || <span style={{ color: "#94a3b8" }}>—</span>}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default Profile;
