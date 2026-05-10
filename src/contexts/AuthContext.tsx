import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getUser());

  useEffect(() => {
    if (getToken() && !user) setUserState(getUser());
  }, []);

  const setUser = (u: AuthUser | null) => setUserState(u);

  const logout = () => {
    clearAuth();
    setUserState(null);
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
