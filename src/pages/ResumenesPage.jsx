import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useMaterias } from "../context/MateriasContext";
import { ROLES } from "../data/authMockData";
import MateriasToolbar from "../features/materias/MateriasToolbar";
import MateriaCard from "../features/materias/MateriaCard";
import BossCard from "../features/materias/BossCard";
import CrearMateriaModal from "../features/materias/CrearMateriaModal";
import MateriaDetalleModal from "../features/materias/MateriaDetalleModal";

export default function ResumenesPage() {
  const { usuario, listarUsuarios } = useAuth();
  if (usuario.rol === ROLES.ADMINISTRADOR) return <ResumenesAdminPage listarUsuarios={listarUsuarios} />;
  return <ResumenesBossPage />;
}

// Administrador: puramente supervisor, ya no tiene Materias propias — ve a
// los boss como tarjetas, entrar a una lleva al detalle de solo lectura
// (ver AdminSupervisarPage.jsx / App.jsx).
function ResumenesAdminPage({ listarUsuarios }) {
  const navigate = useNavigate();
  const [bosses, setBosses] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    listarUsuarios()
      .then((todos) => {
        if (!cancelado) setBosses(todos.filter((u) => u.rol === ROLES.BOSS));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [listarUsuarios]);

  return (
    <Container className="py-4">
      <h4 className="mb-1">Resúmenes</h4>
      <p className="text-body-secondary mb-4">Elegí un usuario para ver sus Materias.</p>

      {cargando ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="info" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : bosses.length === 0 ? (
        <p className="text-body-secondary text-center py-5">Todavía no hay usuarios boss.</p>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {bosses.map((b) => (
            <Col key={b.id}>
              <BossCard
                usuarioBoss={b}
                onClick={() => navigate(`/resumenes/supervisar/${b.id}`, { state: { nombreUsuario: b.nombreUsuario } })}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

// Boss: el grid de Materias de siempre.
function ResumenesBossPage() {
  const { materias, cargando, crearMateria } = useMaterias();

  const [busqueda, setBusqueda] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");
  const [showCrearMateria, setShowCrearMateria] = useState(false);
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState(null);

  const aniosDisponibles = useMemo(
    () => [...new Set(materias.map((m) => m.anio).filter(Boolean))].sort((a, b) => b - a),
    [materias]
  );

  const materiasFiltradas = useMemo(() => {
    return materias.filter((materia) => {
      const coincideBusqueda = materia.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
      const coincideAnio = !anioFiltro || String(materia.anio) === anioFiltro;
      return coincideBusqueda && coincideAnio;
    });
  }, [materias, busqueda, anioFiltro]);

  // Buscamos la materia seleccionada en cada render (en vez de guardar el objeto
  // entero en el state) para que el modal siempre muestre datos actualizados
  // apenas el usuario crea una cátedra/comisión o comparte desde adentro.
  const materiaSeleccionada = materias.find((m) => m.id === materiaSeleccionadaId) ?? null;

  return (
    <Container className="py-4">
      <MateriasToolbar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        anioFiltro={anioFiltro}
        onAnioFiltroChange={setAnioFiltro}
        aniosDisponibles={aniosDisponibles}
        onCrearMateria={() => setShowCrearMateria(true)}
      />

      {cargando ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="info" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : materiasFiltradas.length === 0 ? (
        <p className="text-body-secondary text-center py-5">No se encontraron materias.</p>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {materiasFiltradas.map((materia) => (
            <Col key={materia.id}>
              <MateriaCard materia={materia} onClick={() => setMateriaSeleccionadaId(materia.id)} />
            </Col>
          ))}
        </Row>
      )}

      <CrearMateriaModal show={showCrearMateria} onHide={() => setShowCrearMateria(false)} onCrear={crearMateria} />

      <MateriaDetalleModal
        show={materiaSeleccionada != null}
        onHide={() => setMateriaSeleccionadaId(null)}
        materia={materiaSeleccionada}
      />
    </Container>
  );
}
