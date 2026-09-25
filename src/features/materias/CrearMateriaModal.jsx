import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { ANIOS_CURSADA, labelAnio } from "../../utils/anioCursada";

export default function CrearMateriaModal({ show, onHide, onCrear }) {
  const [nombre, setNombre] = useState("");
  const [anio, setAnio] = useState(ANIOS_CURSADA[0]);
  const [cuatrimestre, setCuatrimestre] = useState("1er cuatrimestre");
  const [descripcion, setDescripcion] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onCrear({ nombre: nombre.trim(), anio: Number(anio), cuatrimestre, descripcion: descripcion.trim() });
    setNombre("");
    setDescripcion("");
    onHide();
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Nueva materia</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              autoFocus
              placeholder="Ej: Derecho Civil I"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>
          <Row className="g-3">
            <Col sm={6}>
              <Form.Group>
                <Form.Label>Año de cursada</Form.Label>
                <Form.Select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
                  {ANIOS_CURSADA.map((a) => (
                    <option key={a} value={a}>
                      {labelAnio(a)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group>
                <Form.Label>Cuatrimestre</Form.Label>
                <Form.Select value={cuatrimestre} onChange={(e) => setCuatrimestre(e.target.value)}>
                  <option>1er cuatrimestre</option>
                  <option>2do cuatrimestre</option>
                  <option>Anual</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Descripción (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Crear materia
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
