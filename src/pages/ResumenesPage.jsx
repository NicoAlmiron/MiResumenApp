import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useMaterias } from "../context/MateriasContext";
import MateriasToolbar from "../features/materias/MateriasToolbar";
import MateriaCard from "../features/materias/MateriaCard";
import CrearMateriaModal from "../features/materias/CrearMateriaModal";
import MateriaDetalleModal from "../features/materias/MateriaDetalleModal";

export default function ResumenesPage() {
  const { materias, crearMateria } = useMaterias();

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

      {materiasFiltradas.length === 0 ? (
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
