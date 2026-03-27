import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/style.css";
import cloudImg from "../assets/cloud-illustration.png";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !newPassword) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        email,
        newPassword
      });

      alert("Password updated successfully ✅");
      navigate("/login");

    } catch (err) {
      alert(err.response?.data || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE (same as login/register) */}
      <div className="auth-left">
        <h1>Reset your password</h1>
        <p>
          No worries. Enter your email and set a new password to regain access
          to your CloudBox account.
        </p>

        <img
          src={cloudImg}
          alt="cloud"
          className="auth-illustration"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        <div className="auth-container">

          <h2>Reset Password</h2>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>

          <div className="divider"></div>

          <Link to="/login">Back to Login</Link>

        </div>
      </div>

    </div>
  );
}

export default ResetPassword;