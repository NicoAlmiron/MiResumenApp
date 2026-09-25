import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";
import AppFooter from "./AppFooter";

// Layout compartido por todas las páginas: navbar fija arriba + el contenido
// de la ruta actual (<Outlet/> es "donde va la página hija" en React Router)
// + footer de ayuda abajo de todo.
export default function MainLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
