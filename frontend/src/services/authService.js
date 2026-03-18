import API from "../api/axiosConfig";
import { jwtDecode } from "jwt-decode";

// ✅ REGISTER
export const registerUser = (data) => {
  return API.post("/auth/register", data);
};

// ✅ LOGIN
export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);

  const token = response.data;

  // ✅ store token
  localStorage.setItem("token", token);

  // ✅ decode token
  const decoded = jwtDecode(token);

  // ✅ store role + email
  localStorage.setItem("role", decoded.role);
  localStorage.setItem("email", decoded.sub);

  return decoded; // return decoded user info (cleaner)
};

// ✅ LOGOUT
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
};