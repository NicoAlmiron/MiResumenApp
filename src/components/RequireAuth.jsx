import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Envuelve las rutas privadas: si no hay sesión, redirige a /login guardando
// la ruta a la que se quería entrar (`state.from`) para volver ahí después
// de loguearse. Si hay sesión, deja pasar (<Outlet/> = la ruta hija real).
export default function RequireAuth() {
  const { estaAutenticado } = useAuth();
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
