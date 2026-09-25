import { Form, Row, Col, Button } from "react-bootstrap";
import { ANIOS_CURSADA, labelAnio } from "../../utils/anioCursada";

export const FILTROS_VACIOS = { contacto: "", materiaId: "", catedraId: "", comisionId: "", anio: "" };

// Filtros de la tabla de envíos: Materia → Cátedra → Comisión encadenados
// (cada select depende del anterior, usando la misma jerarquía anidada de
// `materias`), más Año de cursada y texto libre de Contacto.
export default function EnviosFiltros({ materias, filtros, onFiltrosChange }) {
  const materiaSeleccionada = materias.find((m) => m.id === Number(filtros.materiaId));
  const catedraSeleccionada = materiaSeleccionada?.catedras.find((c) => c.id === Number(filtros.catedraId));
  const hayFiltrosActivos = Object.values(filtros).some(Boolean);

  function actualizar(campo, valor) {
    const nuevo = { ...filtros, [campo]: valor };
    // Cambiar un filtro "de arriba" invalida los que dependían de él.
    if (campo === "materiaId") {
      nuevo.catedraId = "";
      nuevo.comisionId = "";
    }
    if (campo === "catedraId") {
      nuevo.comisionId = "";
    }
    onFiltrosChange(nuevo);
  }

  return (
    <Row className="g-2 mb-3 align-items-center">
      <Col xs={12} md>
        <Form.Control
          type="search"
          placeholder="Buscar por contacto (nombre o teléfono)..."
          value={filtros.contacto}
          onChange={(e) => actualizar("contacto", e.target.value)}
        />
      </Col>
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
      <Col xs={6} md="auto">
        <Form.Select value={filtros.anio} onChange={(e) => actualizar("anio", e.target.value)}>
          <option value="">Todos los años</option>
          {ANIOS_CURSADA.map((a) => (
            <option key={a} value={a}>
              {labelAnio(a)}
            </option>
          ))}
        </Form.Select>
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
  );
}
