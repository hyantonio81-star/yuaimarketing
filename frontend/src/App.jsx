import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MarketIntel from "./pages/MarketIntel";
import CompetitorTracking from "./pages/CompetitorTracking";
import SeoModule from "./pages/SeoModule";
import SeoThreadsCommerce from "./pages/SeoThreadsCommerce";
import B2BTrade from "./pages/B2BTrade";
import B2CCommerce from "./pages/B2CCommerce";
import Ecommerce from "./pages/Ecommerce";
import GovTender from "./pages/GovTender";
import ShortsAgent from "./pages/ShortsAgent";
import PlaceholderPillar from "./pages/PlaceholderPillar";
import Links from "./pages/Links";
import Landing from "./pages/Landing";
import SettingsAccount from "./pages/SettingsAccount";
import SettingsConnections from "./pages/SettingsConnections";
import Admin from "./pages/Admin";
import AdminGuard from "./components/AdminGuard";
import Setup from "./pages/Setup";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/register" element={<Register />} />
      <Route path="/links" element={<Links />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="market-intel" element={<MarketIntel />} />
        <Route path="competitors" element={<CompetitorTracking />} />
        <Route path="seo" element={<SeoModule />} />
        <Route path="seo/threads-commerce" element={<SeoThreadsCommerce />} />
        <Route path="b2b" element={<B2BTrade />} />
        <Route path="b2c" element={<B2CCommerce />} />
        <Route path="b2c/ecommerce" element={<Ecommerce />} />
        <Route path="gov" element={<GovTender />} />
        <Route path="shorts" element={<ShortsAgent />} />
        <Route path="settings" element={<Navigate to="/settings/account" replace />} />
        <Route path="settings/account" element={<SettingsAccount />} />
        <Route path="settings/connections" element={<SettingsConnections />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
