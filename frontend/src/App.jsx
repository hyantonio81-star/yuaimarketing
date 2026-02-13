import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MarketIntel from "./pages/MarketIntel";
import CompetitorTracking from "./pages/CompetitorTracking";
import SeoModule from "./pages/SeoModule";
import B2BTrade from "./pages/B2BTrade";
import B2CCommerce from "./pages/B2CCommerce";
import GovTender from "./pages/GovTender";
import PlaceholderPillar from "./pages/PlaceholderPillar";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="market-intel" element={<MarketIntel />} />
        <Route path="competitors" element={<CompetitorTracking />} />
        <Route path="seo" element={<SeoModule />} />
        <Route path="b2b" element={<B2BTrade />} />
        <Route path="b2c" element={<B2CCommerce />} />
        <Route path="gov" element={<GovTender />} />
      </Route>
    </Routes>
  );
}
