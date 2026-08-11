import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ACCESS_SESSION_KEY = "high-streets-access";

interface AccessContextValue {
  isAuthenticated: boolean;
  grantAccess: () => void;
  revokeAccess: () => void;
}

const AccessContext = createContext<AccessContextValue | null>(null);

function readStoredAccess(): boolean {
  try {
    return sessionStorage.getItem(ACCESS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredAccess);

  const grantAccess = useCallback(() => {
    try {
      sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    setIsAuthenticated(true);
  }, []);

  const revokeAccess = useCallback(() => {
    try {
      sessionStorage.removeItem(ACCESS_SESSION_KEY);
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, grantAccess, revokeAccess }),
    [isAuthenticated, grantAccess, revokeAccess]
  );

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error("useAccess must be used within AccessProvider");
  }
  return ctx;
}
