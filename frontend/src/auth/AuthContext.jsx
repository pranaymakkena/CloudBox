import { createContext, useState, useEffect } from "react";
import {
  clearSession,
  getValidatedSession,
  persistSession,
} from "../services/sessionService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Restore user on page reload
  useEffect(() => {
    const session = getValidatedSession();

    if (session) {
      setUser(session.decoded);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // ✅ Login (used after authService)
  const login = (token) => {
    const decoded = persistSession(token);

    setUser(decoded);
    setIsAuthenticated(true);
  };

  // ✅ Logout
  const logout = () => {
    clearSession();

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
