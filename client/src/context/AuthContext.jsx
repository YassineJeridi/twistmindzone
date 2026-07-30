import { createContext, useCallback, useContext, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => Boolean(getToken()));
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);

  const unlock = useCallback(async (passkey) => {
    const { token } = await api.login(passkey);
    setToken(token);
    setUnlocked(true);
    setPasskeyModalOpen(false);
  }, []);

  const lock = useCallback(() => {
    clearToken();
    setUnlocked(false);
  }, []);

  const openPasskeyModal = useCallback(() => setPasskeyModalOpen(true), []);
  const closePasskeyModal = useCallback(() => setPasskeyModalOpen(false), []);

  return (
    <AuthContext.Provider
      value={{ unlocked, unlock, lock, passkeyModalOpen, openPasskeyModal, closePasskeyModal }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
