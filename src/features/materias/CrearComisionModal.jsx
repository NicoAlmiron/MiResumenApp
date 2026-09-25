import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

// Modal para agregar una Comisión dentro de una Cátedra puntual.
export default function CrearComisionModal({ show, onHide, catedraNombre, onCrear }) {
  const [nombre, setNombre] = useState("");
  const [turno, setTurno] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onCrear({ nombre: nombre.trim(), turno: turno.trim() });
    setNombre("");
    setTurno("");
    onHide();
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Nueva comisión en {catedraNombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre o número de comisión</Form.Label>
            <Form.Control
              autoFocus
              placeholder="Ej: Comisión 3"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Turno (opcional)</Form.Label>
            <Form.Control placeholder="Ej: Mañana" value={turno} onChange={(e) => setTurno(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Crear comisión
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
