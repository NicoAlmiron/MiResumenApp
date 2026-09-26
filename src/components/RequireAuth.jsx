import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

// Envuelve las rutas privadas: si no hay sesión, redirige a /login guardando
// la ruta a la que se quería entrar (`state.from`) para volver ahí después
// de loguearse. Si hay sesión, deja pasar (<Outlet/> = la ruta hija real).
// Mientras se valida el token guardado contra la API (`cargandoSesion`), no
// se decide nada todavía — si no, un F5 en una ruta privada rebota a Login
// un instante antes de confirmar que la sesión sigue viva.
export default function RequireAuth() {
  const { estaAutenticado, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="info" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
