// src/contexts/AuthContext.jsx
import React, { createContext, useContext } from 'react';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  // à compléter si tu ajoutes JWT…
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}
