import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/style.css";
import cloudImg from "../assets/cloud-illustration.png";
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
      const user = await loginUser({ email, password });
      localStorage.setItem("name", email.split("@")[0]);

      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="auth-page">

    {/* LEFT SIDE */}
    <div className="auth-left">
      <h1>Welcome back</h1>
      <p>
        Store, share and access your files securely anytime.
        CloudBox keeps your data safe and organized.
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
        <h2>Login</h2>

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

        <button
          className="btn btn-primary btn-full"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link to="/reset-password">Forgot Password?</Link>

        <div className="divider"></div>

        <Link to="/register">Create an account</Link>
      </div>

    </div>
  </div>
);
}

export default Login;