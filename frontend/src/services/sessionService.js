import { jwtDecode } from "jwt-decode";

const SESSION_KEYS = ["token", "role", "email", "name"];

export const clearSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

const isTokenExpired = (decodedToken) => {
  if (!decodedToken?.exp) {
    return true;
  }

  return decodedToken.exp * 1000 <= Date.now();
};

export const getValidatedSession = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    if (isTokenExpired(decoded)) {
      clearSession();
      return null;
    }

    return { token, decoded };
  } catch (error) {
    clearSession();
    return null;
  }
};

export const persistSession = (token) => {
  const decoded = jwtDecode(token);

  if (isTokenExpired(decoded)) {
    clearSession();
    throw new Error("Received an expired session token");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", decoded.role);
  localStorage.setItem("email", decoded.sub);

  return decoded;
};

export const getSessionUser = () => {
  const session = getValidatedSession();

  if (!session) {
    return null;
  }

  const email = session.decoded.sub || "";
  const storedName = localStorage.getItem("name");
  const fallbackName = email ? email.split("@")[0] : "User";

  return {
    token: session.token,
    decoded: session.decoded,
    email,
    role: session.decoded.role || "USER",
    name: storedName || fallbackName,
  };
};

export const isSessionActive = () => !!getValidatedSession();

export const getDashboardRouteForRole = (role) =>
  role === "ADMIN" ? "/admin" : "/dashboard";
