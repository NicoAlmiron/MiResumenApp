import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);
const CLAVE_STORAGE = "miresumen_auth";

// Usuario de prueba para poder probar el login sin backend todavía.
// Cuando exista la API real (RF-29 a RF-33: passlib/bcrypt + JWT), este
// archivo se reemplaza por llamadas a POST /auth/login — el resto de la
// app (RequireAuth, AppNavbar) no debería necesitar cambios porque solo
// dependen de `useAuth()`, no de cómo se resuelve el login por dentro.
const USUARIO_PRUEBA = { nombreUsuario: "admin", password: "admin123" };

function leerSesionGuardada() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null; // localStorage puede fallar (modo privado, storage bloqueado, etc.)
  }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_STORAGE);
  } catch {
    // si falla, la sesión sigue viva en memoria para esta pestaña igual
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesionGuardada);

  const login = useCallback((nombreUsuario, password) => {
    const credencialesValidas =
      nombreUsuario === USUARIO_PRUEBA.nombreUsuario && password === USUARIO_PRUEBA.password;
    if (!credencialesValidas) return false;

    const sesion = { nombreUsuario };
    setUsuario(sesion);
    guardarSesion(sesion);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    guardarSesion(null);
  }, []);

  const value = { usuario, estaAutenticado: usuario != null, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
