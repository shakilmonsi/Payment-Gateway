// src/router/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../featured/auth/AuthContext";

// PrivateRoute to check if a user is logged in
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth/login" replace />;
};

// New PrivateAdminRoute to check for admin role
const PrivateAdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  const isAdmin = user && user.role && user.role.toUpperCase() === "ADMIN";

  return isAdmin ? children : <Navigate to="/" replace />;
};

export { PrivateRoute, PrivateAdminRoute };
