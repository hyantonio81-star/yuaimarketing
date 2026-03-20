import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const Links = lazy(() => import("./pages/Links"));
const GoRedirect = lazy(() => import("./pages/GoRedirect"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const Products = lazy(() => import("./pages/Products"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Tienda = lazy(() => import("./pages/Tienda"));
const TiendaDetail = lazy(() => import("./pages/TiendaDetail"));
const CartonDR = lazy(() => import("./pages/CartonDR"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TiendaAdminLayout = lazy(() => import("./pages/tienda-admin/TiendaAdminLayout"));
const TiendaAdminList = lazy(() => import("./pages/tienda-admin/TiendaAdminList"));
const TiendaAdminProductForm = lazy(() => import("./pages/tienda-admin/TiendaAdminProductForm"));

const pageFallback = (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
    Loading...
  </div>
);

function withSuspense(element) {
  return <Suspense fallback={pageFallback}>{element}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={withSuspense(<Home />)} />
        <Route path="/carton-dr" element={withSuspense(<CartonDR />)} />
        <Route path="/links" element={withSuspense(<Links />)} />
        <Route path="/products" element={withSuspense(<Products />)} />
        <Route path="/tienda" element={withSuspense(<Tienda />)} />
        <Route path="/tienda/:slug" element={withSuspense(<TiendaDetail />)} />
        <Route path="/tienda-admin" element={withSuspense(<TiendaAdminLayout />)}>
          <Route index element={withSuspense(<TiendaAdminList />)} />
          <Route path="new" element={withSuspense(<TiendaAdminProductForm />)} />
          <Route path="edit/:id" element={withSuspense(<TiendaAdminProductForm />)} />
        </Route>
        <Route path="/blog" element={withSuspense(<Blog />)} />
        <Route path="/blog/:slug" element={withSuspense(<BlogPost />)} />
        <Route path="/contact" element={withSuspense(<Contact />)} />
        <Route path="/privacy" element={withSuspense(<Privacy />)} />
        <Route path="/terms" element={withSuspense(<Terms />)} />
        <Route path="/go/:id" element={withSuspense(<GoRedirect />)} />
        <Route path="/p/:slug" element={withSuspense(<ProductPage />)} />
        <Route path="*" element={withSuspense(<NotFound />)} />
      </Routes>
    </ErrorBoundary>
  );
}
