import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/auth/Login";
import Dashboard from "./Pages/dashboard/DashboardHome"; // placeholder
import ProtectedRoute from "./Components/ProtectedRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />



        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
