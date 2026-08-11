import { APIProvider } from "@vis.gl/react-google-maps";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedOutlet } from "./components/ProtectedOutlet";
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AccessGatePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MasterMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dev/geocode"
        element={
          <ProtectedRoute>
            <DevGeocodePage />
          </ProtectedRoute>
        }
      />
      {/*
        Nested under /street/:slug and /center/:slug so map ↔ info swaps via
        Outlet. Keep these route trees stable (no useLocation keys here) —
        remounting Routes mid-navigate was leaving the map mounted.
      */}
      <Route path="/street/:slug" element={<ProtectedOutlet />}>
        <Route index element={<StreetDetailPage />} />
        <Route path="map" element={<StreetMapPage />} />
      </Route>
      <Route path="/center/:slug" element={<ProtectedOutlet />}>
        <Route index element={<StreetDetailPage />} />
        <Route path="map" element={<ShoppingCenterMapPage />} />
      </Route>
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
