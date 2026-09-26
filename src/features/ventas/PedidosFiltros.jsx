import { Form, Row, Col, Button } from "react-bootstrap";
import FiltroAnioDropdown from "../../components/FiltroAnioDropdown";
import RangoFechaPicker from "./RangoFechaPicker";

export const FILTROS_VACIOS = {
  busqueda: "",
  materiaId: "",
  catedraId: "",
  comisionId: "",
  anio: "",
  fechaDesde: "",
  fechaHasta: "",
};

// Filtros de la tabla de pedidos: arriba una única barra de búsqueda (por
// materia, nombre de contacto o teléfono), y debajo los selects — Materia →
// Cátedra → Comisión encadenados, Año de cursada (se bloquea y se autocompleta
// apenas elegís una Materia, porque el año ya queda determinado por ella) y
// un rango de fechas (desde/hasta).
export default function PedidosFiltros({ materias, filtros, onFiltrosChange }) {
  const materiaSeleccionada = materias.find((m) => m.id === Number(filtros.materiaId));
  const catedraSeleccionada = materiaSeleccionada?.catedras.find((c) => c.id === Number(filtros.catedraId));
  const hayFiltrosActivos = Object.values(filtros).some(Boolean);

  function actualizar(campo, valor) {
    const nuevo = { ...filtros, [campo]: valor };

    if (campo === "materiaId") {
      nuevo.catedraId = "";
      nuevo.comisionId = "";
      // Al elegir Materia, el año de cursada queda determinado por ella —
      // se autocompleta y el select se bloquea (ver más abajo).
      const materia = materias.find((m) => m.id === Number(valor));
      nuevo.anio = valor ? String(materia?.anio ?? "") : "";
    }
    if (campo === "catedraId") {
      nuevo.comisionId = "";
    }

    onFiltrosChange(nuevo);
  }

  return (
    <div className="d-flex flex-column gap-2 mb-3">
      <Form.Control
        type="search"
        placeholder="Buscar por materia, nombre o teléfono..."
        value={filtros.busqueda}
        onChange={(e) => actualizar("busqueda", e.target.value)}
      />

      <Row className="g-2 align-items-center">
        <Col xs={6} md="auto">
          <Form.Select value={filtros.materiaId} onChange={(e) => actualizar("materiaId", e.target.value)}>
            <option value="">Todas las materias</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md="auto">
          <Form.Select
            value={filtros.catedraId}
            onChange={(e) => actualizar("catedraId", e.target.value)}
            disabled={!materiaSeleccionada}
          >
            <option value="">Todas las cátedras</option>
            {materiaSeleccionada?.catedras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md="auto">
          <Form.Select
            value={filtros.comisionId}
            onChange={(e) => actualizar("comisionId", e.target.value)}
            disabled={!catedraSeleccionada?.comisiones.length}
          >
            <option value="">Todas las comisiones</option>
            {catedraSeleccionada?.comisiones.map((co) => (
              <option key={co.id} value={co.id}>
                {co.nombre}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md="auto" title={materiaSeleccionada ? "Se bloquea porque ya lo determina la materia elegida" : undefined}>
          <FiltroAnioDropdown
            value={filtros.anio}
            onChange={(valor) => actualizar("anio", valor)}
            disabled={Boolean(materiaSeleccionada)}
          />
        </Col>

        <Col xs="auto">
          <RangoFechaPicker
            desde={filtros.fechaDesde}
            hasta={filtros.fechaHasta}
            onCambiar={(cambios) => onFiltrosChange({ ...filtros, ...cambios })}
          />
        </Col>

        {hayFiltrosActivos && (
          <Col xs="auto">
            <Button variant="outline-secondary" size="sm" onClick={() => onFiltrosChange(FILTROS_VACIOS)}>
              <i className="bi bi-x-lg me-1" aria-hidden="true" />
              Limpiar
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
}
