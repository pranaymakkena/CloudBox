import { useState } from "react";
import { registerUser } from "../services/authService";

function Register() {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {

      await registerUser(formData);

      alert("Registration Successful");

    } catch (error) {

      console.log(error);
      alert("Registration Failed");

    }

  };

  return (

    <div className="container">

      <h2>Create Account</h2>

      <input name="firstName" placeholder="First Name" onChange={handleChange} />

      <input name="lastName" placeholder="Last Name" onChange={handleChange} />

      <select name="gender" onChange={handleChange}>
        <option value="">Select Gender</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
        <option value="OTHER">Other</option>
      </select>

      <input type="date" name="dob" onChange={handleChange} />

      <input name="location" placeholder="Location" onChange={handleChange} />

      <input name="email" placeholder="Email" onChange={handleChange} />

      <input type="password" name="password" placeholder="Password" onChange={handleChange} />

      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} />

      <button onClick={handleRegister}>Register</button>

      <p>
        Already have an account? <a href="/login">Login</a>
      </p>

    </div>

  );

}

export default Register;