import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Igual que RequireAuth pero por rol: si el usuario logueado no tiene uno de
// los roles permitidos, lo manda a `redirigirA` en vez de dejarlo pasar.
// Se usa DENTRO de <RequireAuth/>, así que acá `usuario` ya existe siempre.
export default function RequireRol({ roles, redirigirA = "/herramientas" }) {
  const { usuario } = useAuth();

  if (!roles.includes(usuario.rol)) {
    return <Navigate to={redirigirA} replace />;
  }

  return <Outlet />;
}
