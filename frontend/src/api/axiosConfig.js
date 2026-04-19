import axios from "axios";
import {
  clearSession,
  getValidatedSession,
  setSessionNotice,
} from "../services/sessionService";
import {
  markBackendAvailable,
  markBackendUnavailable,
} from "../utils/backendStatus";
import { isBackendUnavailableError } from "../utils/requestErrors";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

const ACCOUNT_SUSPENDED_PREFIX = "ACCOUNT_SUSPENDED:";
const ACCOUNT_DELETED_PREFIX = "ACCOUNT_DELETED:";

const extractErrorMessage = (error) =>
  typeof error?.response?.data === "string" ? error.response.data : "";

const redirectToLoginWithNotice = (message) => {
  clearSession();
  setSessionNotice(message);

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

API.interceptors.request.use((config) => {
  const session = getValidatedSession();

  if (session) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;

});

API.interceptors.response.use(
  (response) => {
    markBackendAvailable();
    return response;
  },
  (error) => {
    const responseMessage = extractErrorMessage(error);

    if (responseMessage.startsWith(ACCOUNT_SUSPENDED_PREFIX)) {
      redirectToLoginWithNotice(
        responseMessage.slice(ACCOUNT_SUSPENDED_PREFIX.length).trim() ||
          "Your account has been suspended."
      );
    } else if (responseMessage.startsWith(ACCOUNT_DELETED_PREFIX)) {
      redirectToLoginWithNotice(
        responseMessage.slice(ACCOUNT_DELETED_PREFIX.length).trim() ||
          "Your account is no longer available."
      );
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      clearSession();
    }

    if (isBackendUnavailableError(error)) {
      markBackendUnavailable(error);
    } else {
      markBackendAvailable();
    }

    return Promise.reject(error);
  }
);


export default API;
