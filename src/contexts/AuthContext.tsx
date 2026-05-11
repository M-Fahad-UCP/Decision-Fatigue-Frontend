import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Lazy import to avoid circular dependency — store imports auth, auth imports store
async function resetApiCache() {
  const { useStore: _unused, ...mod } = await import("@/lib/store") as unknown as { useStore: unknown; resetApiCache?: () => void };
  // Module-level reset — call directly on the exported object
  void _unused;
  if (mod.resetApiCache) mod.resetApiCache();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getUser());

  useEffect(() => {
    if (getToken() && !user) setUserState(getUser());
  }, []);

  const setUser = (u: AuthUser | null) => setUserState(u);

  const logout = () => {
    clearAuth();
    setUserState(null);
    // Reset so next login re-fetches fresh data from API
    resetApiCache().catch(() => {});
    // Hard reload to clear all module-level state
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
