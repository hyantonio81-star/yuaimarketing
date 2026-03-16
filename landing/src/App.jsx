import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Links from "./pages/Links";
import GoRedirect from "./pages/GoRedirect";
import ProductPage from "./pages/ProductPage";
import Products from "./pages/Products";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Tienda from "./pages/Tienda";
import TiendaDetail from "./pages/TiendaDetail";
import CartonDR from "./pages/CartonDR";
import TiendaAdminLayout from "./pages/tienda-admin/TiendaAdminLayout";
import TiendaAdminList from "./pages/tienda-admin/TiendaAdminList";
import TiendaAdminProductForm from "./pages/tienda-admin/TiendaAdminProductForm";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/carton-dr" element={<CartonDR />} />
      <Route path="/links" element={<Links />} />
      <Route path="/products" element={<Products />} />
      <Route path="/tienda" element={<Tienda />} />
      <Route path="/tienda/:slug" element={<TiendaDetail />} />
      <Route path="/tienda-admin" element={<TiendaAdminLayout />}>
        <Route index element={<TiendaAdminList />} />
        <Route path="new" element={<TiendaAdminProductForm />} />
        <Route path="edit/:id" element={<TiendaAdminProductForm />} />
      </Route>
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/go/:id" element={<GoRedirect />} />
      <Route path="/p/:slug" element={<ProductPage />} />
    </Routes>
  );
}
