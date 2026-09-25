import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MateriasProvider } from "./context/MateriasContext";
import MainLayout from "./layout/MainLayout";
import ResumenesPage from "./pages/ResumenesPage";
import VentasPage from "./pages/VentasPage";
import TableroPage from "./pages/TableroPage";

// MateriasProvider envuelve TODO el árbol de rutas: así cualquier página
// (Resúmenes, Tablero, y el día de mañana Ventas) lee y modifica los mismos
// datos en memoria a través de useMaterias().
export default function App() {
  return (
    <MateriasProvider>
      <BrowserRouter>
        <Routes>
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
        </Routes>
      </BrowserRouter>
    </MateriasProvider>
  );
}
