import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      // ✅ loginUser already:
      // - stores token
      // - stores role
      // - returns decoded user
      const user = await loginUser({ email, password });

      // ✅ Just redirect
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }

    } catch (err) {
      alert(err.response?.data || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Login to CloudBox</h2>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <a href="/reset-password">Forgot Password?</a>

        <div className="divider"></div>

        <a href="/register">Create an account</a>
      </div>
    </div>
  );
}

export default Login;