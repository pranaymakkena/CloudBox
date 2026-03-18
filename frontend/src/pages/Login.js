import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {

    try {

      const res = await loginUser({ email, password });

      localStorage.setItem("token", res.data);

      navigate("/dashboard");

    } catch (err) {

      alert("Invalid Credentials");

    }

  };

  return (

    <div className="container">

      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>

    </div>

  );

}

export default Login;