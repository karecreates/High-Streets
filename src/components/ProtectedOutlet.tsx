import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

/** Auth gate + nested route outlet for corridor info/map pages. */
export function ProtectedOutlet() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}
