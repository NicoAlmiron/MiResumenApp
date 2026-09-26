import { Form, Button, Row, Col } from "react-bootstrap";
import FiltroAnioDropdown from "../../components/FiltroAnioDropdown";

// Barra de funcionalidades de la pestaña Resúmenes: buscador + filtro por
// año + botón "Crear materia". `aniosDisponibles` se calcula en ResumenesPage
// a partir de las materias existentes, así el filtro nunca queda vacío/desactualizado.
export default function MateriasToolbar({
  busqueda,
  onBusquedaChange,
  anioFiltro,
  onAnioFiltroChange,
  aniosDisponibles,
  onCrearMateria,
}) {
  return (
    <Row className="g-2 align-items-center mb-4">
      <Col xs={12} md>
        <Form.Control
          type="search"
          placeholder="Buscar materia..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
      </Col>
      <Col xs={6} md="auto">
        <FiltroAnioDropdown value={anioFiltro} onChange={onAnioFiltroChange} opciones={aniosDisponibles} />
      </Col>
      <Col xs={6} md="auto">
        <Button variant="primary" className="w-100" onClick={onCrearMateria}>
          + Crear materia
        </Button>
      </Col>
    </Row>
  );
}
