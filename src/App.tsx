import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AccessProvider } from "./context/AccessContext";
import { TenantsProvider } from "./context/TenantsContext";
import { AccessGatePage } from "./pages/AccessGatePage";
import { DashboardPage } from "./pages/DashboardPage";
import { MasterMapPage } from "./pages/MasterMapPage";
import { DevGeocodePage } from "./pages/DevGeocodePage";
import { StreetDetailPage } from "./pages/StreetDetailPage";
import { ShoppingCenterMapPage } from "./pages/ShoppingCenterMapPage";
import { StreetMapPage } from "./pages/StreetMapPage";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

function withAuth(page: ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AccessGatePage />} />
      <Route path="/dashboard" element={withAuth(<DashboardPage />)} />
      <Route path="/map" element={withAuth(<MasterMapPage />)} />
      <Route path="/dev/geocode" element={withAuth(<DevGeocodePage />)} />
      {/*
        Sibling routes (not nested Outlet) so map ↔ dedicated-page navigation
        fully unmounts the Google Map view. Nested /:slug + /:slug/map left the
        map mounted after client-side Back navigation.
      */}
      <Route path="/street/:slug" element={withAuth(<StreetDetailPage />)} />
      <Route path="/street/:slug/map" element={withAuth(<StreetMapPage />)} />
      <Route path="/center/:slug" element={withAuth(<StreetDetailPage />)} />
      <Route
        path="/center/:slug/map"
        element={withAuth(<ShoppingCenterMapPage />)}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AccessProvider>
      <APIProvider apiKey={apiKey}>
        <TenantsProvider>
          <AppRoutes />
        </TenantsProvider>
      </APIProvider>
    </AccessProvider>
  );
}
