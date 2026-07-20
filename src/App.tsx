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
      <Route
        path="/street/:slug"
        element={
          <ProtectedRoute>
            <StreetDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/street/:slug/map"
        element={
          <ProtectedRoute>
            <StreetMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/center/:slug"
        element={
          <ProtectedRoute>
            <StreetDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/center/:slug/map"
        element={
          <ProtectedRoute>
            <ShoppingCenterMapPage />
          </ProtectedRoute>
        }
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
