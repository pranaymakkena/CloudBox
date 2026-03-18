import API from "../api/axiosConfig";

export const registerUser = (data) => {
  return API.post("/auth/register", data);
};

export const loginUser = async (data) => {

  const response = await API.post("/auth/login", data);

  localStorage.setItem("token", response.data);
    localStorage.setItem("email", data.email);
  return response;

};

export const logoutUser = () => {
  localStorage.removeItem("token");
};