import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../data/authMockData";

// A dónde mandar la ruta raíz ("/") según el rol — evita el doble redirect
// de mandar siempre a /resumenes y que RequireRol lo rebote a /herramientas
// cuando el rol es "usuario".
export default function IndexRedirect() {
  const { usuario } = useAuth();
  const destino = usuario.rol === ROLES.USUARIO ? "/herramientas" : "/resumenes";
  return <Navigate to={destino} replace />;
}
