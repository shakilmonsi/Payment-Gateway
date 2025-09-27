// src/App.jsx (or your main entry file)

import { RouterProvider } from "react-router-dom";
import { AppRoutes } from "./router/router";
import "react-datepicker/dist/react-datepicker.css";
import AuthProvider from "./featured/auth/AuthProvider";
import toast, { Toaster } from "react-hot-toast"; // Import Toaster here

const App = () => {
  return (
    <AuthProvider>
      {/* Place Toaster here at the root */}
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={AppRoutes} />
    </AuthProvider>
  );
};

export default App;
