import axios from "axios";
import { clearSession, getValidatedSession } from "../services/sessionService";


const API = axios.create({
  baseURL: "http://localhost:8080/api"
});

API.interceptors.request.use((config) => {
  const session = getValidatedSession();

  if (session) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;

});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearSession();
    }

    return Promise.reject(error);
  }
);


export default API;
