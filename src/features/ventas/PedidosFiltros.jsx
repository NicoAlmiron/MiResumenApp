import { Form, Row, Col, Button } from "react-bootstrap";
import SelectDropdown from "../../components/SelectDropdown";
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
          <SelectDropdown
            value={filtros.materiaId}
            onChange={(valor) => actualizar("materiaId", valor)}
            opciones={[
              { value: "", label: "Todas las materias", separadorDespues: materias.length > 0 },
              ...materias.map((m) => ({ value: String(m.id), label: m.nombre })),
            ]}
          />
        </Col>
        <Col xs={6} md="auto">
          <SelectDropdown
            value={filtros.catedraId}
            onChange={(valor) => actualizar("catedraId", valor)}
            disabled={!materiaSeleccionada}
            opciones={[
              {
                value: "",
                label: "Todas las cátedras",
                separadorDespues: (materiaSeleccionada?.catedras.length ?? 0) > 0,
              },
              ...(materiaSeleccionada?.catedras.map((c) => ({ value: String(c.id), label: c.nombre })) ?? []),
            ]}
          />
        </Col>
        <Col xs={6} md="auto">
          <SelectDropdown
            value={filtros.comisionId}
            onChange={(valor) => actualizar("comisionId", valor)}
            disabled={!catedraSeleccionada?.comisiones.length}
            opciones={[
              {
                value: "",
                label: "Todas las comisiones",
                separadorDespues: (catedraSeleccionada?.comisiones.length ?? 0) > 0,
              },
              ...(catedraSeleccionada?.comisiones.map((co) => ({ value: String(co.id), label: co.nombre })) ?? []),
            ]}
          />
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
