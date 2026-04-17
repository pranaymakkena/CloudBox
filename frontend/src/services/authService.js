import API from "../api/axiosConfig";
import { clearSession, persistSession } from "./sessionService";

// ✅ REGISTER
export const registerUser = (data) => {
  return API.post("/auth/register", data);
};

// ✅ LOGIN
export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);
  const token = response.data;

  console.log("Received token:", response); // Debugging log
  return persistSession(token);
};

// ✅ LOGOUT
export const logoutUser = () => {
  clearSession();
};
