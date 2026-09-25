import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MateriasProvider } from "./context/MateriasContext";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import ResumenesPage from "./pages/ResumenesPage";
import VentasPage from "./pages/VentasPage";
import TableroPage from "./pages/TableroPage";

// AuthProvider afuera de todo: la sesión no depende de qué ruta esté activa.
// MateriasProvider envuelve el árbol de rutas: así cualquier página
// (Resúmenes, Tablero, y el día de mañana Ventas) lee y modifica los mismos
// datos en memoria a través de useMaterias().
export default function App() {
  return (
    <AuthProvider>
      <MateriasProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Todo lo de acá para abajo exige sesión iniciada (RequireAuth
                redirige a /login si no hay usuario logueado). */}
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/resumenes" replace />} />
                <Route path="resumenes" element={<ResumenesPage />} />
                <Route path="ventas" element={<VentasPage />} />
                <Route path="materias/:materiaId/catedras/:catedraId/tablero" element={<TableroPage />} />
                <Route
                  path="materias/:materiaId/catedras/:catedraId/comisiones/:comisionId/tablero"
                  element={<TableroPage />}
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MateriasProvider>
    </AuthProvider>
  );
}
