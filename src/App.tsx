import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { LandingPage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/AdminDashboard";

export default function App() {
  return (
    <AppProvider>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AdminAuthProvider>
    </AppProvider>
  );
}
