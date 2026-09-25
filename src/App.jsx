import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { AuthProvider } from "./context/AuthContext";
import { MateriasProvider } from "./context/MateriasContext";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import ResumenesPage from "./pages/ResumenesPage";
import VentasPage from "./pages/VentasPage";
import TableroPage from "./pages/TableroPage";
import HerramientasPage from "./pages/HerramientasPage";

// Las páginas de Herramientas cargan pdf-lib / pdfjs-dist / docx / mammoth,
// que son pesadas y solo las necesita quien realmente entra ahí — con
// React.lazy quedan en chunks separados, en vez de inflar el bundle inicial
// de Login/Resúmenes/Ventas (que carga todo el mundo).
const UnirPdfsPage = lazy(() => import("./pages/herramientas/UnirPdfsPage"));
const PdfAWordPage = lazy(() => import("./pages/herramientas/PdfAWordPage"));
const WordAPdfPage = lazy(() => import("./pages/herramientas/WordAPdfPage"));

function CargandoHerramienta() {
  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" variant="info" role="status">
        <span className="visually-hidden">Cargando...</span>
      </Spinner>
    </div>
  );
}

// AuthProvider afuera de todo: la sesión no depende de qué ruta esté activa.
// MateriasProvider envuelve el árbol de rutas: así cualquier página
// (Resúmenes, Tablero, Ventas) lee y modifica los mismos datos en memoria a
// través de useMaterias(). Herramientas no la necesita (no toca el dominio).
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

                <Route path="herramientas" element={<HerramientasPage />} />
                <Route
                  path="herramientas/unir-pdfs"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <UnirPdfsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="herramientas/pdf-a-word"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <PdfAWordPage />
                    </Suspense>
                  }
                />
                <Route
                  path="herramientas/word-a-pdf"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <WordAPdfPage />
                    </Suspense>
                  }
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
