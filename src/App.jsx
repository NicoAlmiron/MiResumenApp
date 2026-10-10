import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { AuthProvider } from "./context/AuthContext";
import { MateriasProvider } from "./context/MateriasContext";
import { ROLES } from "./data/authMockData";
import RequireAuth from "./components/RequireAuth";
import RequireRol from "./components/RequireRol";
import IndexRedirect from "./components/IndexRedirect";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import ResumenesPage from "./pages/ResumenesPage";
import VentasPage from "./pages/VentasPage";
import TableroPage from "./pages/TableroPage";
import HerramientasPage from "./pages/HerramientasPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

// Páginas menos frecuentes / pesadas: quedan en chunks separados con
// React.lazy en vez de inflar el bundle inicial de Login/Resúmenes/Ventas.
const UnirPdfsPage = lazy(() => import("./pages/herramientas/UnirPdfsPage"));
const UnirArchivosPage = lazy(() => import("./pages/herramientas/UnirArchivosPage"));
const DividirPdfPage = lazy(() => import("./pages/herramientas/DividirPdfPage"));
const ImagenesAPdfPage = lazy(() => import("./pages/herramientas/ImagenesAPdfPage"));
const PdfAWordPage = lazy(() => import("./pages/herramientas/PdfAWordPage"));
const WordAPdfPage = lazy(() => import("./pages/herramientas/WordAPdfPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminSupervisarPage = lazy(() => import("./pages/AdminSupervisarPage"));

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
// (Resúmenes, Tablero, Ventas, Admin) lee y modifica los mismos datos en
// memoria a través de useMaterias(). Herramientas y Configuración no la
// necesitan (no tocan el dominio de Materias).
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
                <Route index element={<IndexRedirect />} />

                {/* Resúmenes/Ventas/Tablero: para administrador y boss —
                    el rol "usuario" solo tiene Herramientas. */}
                <Route element={<RequireRol roles={[ROLES.ADMINISTRADOR, ROLES.BOSS]} />}>
                  <Route path="resumenes" element={<ResumenesPage />} />
                  <Route path="ventas" element={<VentasPage />} />
                  <Route path="materias/:materiaId/catedras/:catedraId/tablero" element={<TableroPage />} />
                  <Route
                    path="materias/:materiaId/catedras/:catedraId/comisiones/:comisionId/tablero"
                    element={<TableroPage />}
                  />
                </Route>

                {/* Herramientas y Configuración: los 3 roles */}
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
                  path="herramientas/unir-archivos"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <UnirArchivosPage />
                    </Suspense>
                  }
                />
                <Route
                  path="herramientas/dividir-pdf"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <DividirPdfPage />
                    </Suspense>
                  }
                />
                <Route
                  path="herramientas/imagenes-a-pdf"
                  element={
                    <Suspense fallback={<CargandoHerramienta />}>
                      <ImagenesAPdfPage />
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
                <Route path="configuracion" element={<ConfiguracionPage />} />

                {/* Backoffice + supervisión de Resúmenes: solo administrador */}
                <Route element={<RequireRol roles={[ROLES.ADMINISTRADOR]} />}>
                  <Route
                    path="admin"
                    element={
                      <Suspense fallback={<CargandoHerramienta />}>
                        <AdminPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="resumenes/supervisar/:usuarioId"
                    element={
                      <Suspense fallback={<CargandoHerramienta />}>
                        <AdminSupervisarPage />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MateriasProvider>
    </AuthProvider>
  );
}
