import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/style.css";
import cloudImg from "../assets/cloud-illustration.png";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password) {
      alert("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData);
      alert("Registration Successful 🎉");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert("Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE (same as login) */}
      <div className="auth-left">
        <h1>Create your account</h1>
        <p>
          Join CloudBox and start storing, sharing and accessing your files
          securely from anywhere.
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
          <h2>Register</h2>

          <input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
          />

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <div className="divider"></div>

          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>

    </div>
  );
}

export default Register;