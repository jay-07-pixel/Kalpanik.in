import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { MarketingHome } from "./pages/MarketingHome";
import { PricingPage } from "./pages/PricingPage";
import { RenewPage } from "./pages/RenewPage";
import { AdminDashboard } from "./pages/AdminDashboard";

export default function App() {
  return (
    <AppProvider>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<MarketingHome />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/renew" element={<RenewPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AdminAuthProvider>
    </AppProvider>
  );
}
