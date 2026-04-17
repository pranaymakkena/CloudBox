import { Navigate } from "react-router-dom";
import { getValidatedSession } from "../services/sessionService";

function ProtectedRoute({ children, allowedRoles }) {
  const session = getValidatedSession();

  if (!session) {
    return <Navigate to="/login" />;
  }

  const role = session.decoded.role;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
