import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

// Modal para agregar una Cátedra a una Materia ("Crear sección").
export default function CrearCatedraModal({ show, onHide, materiaNombre, onCrear }) {
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onCrear({ nombre: nombre.trim(), profesor: profesor.trim() });
    setNombre("");
    setProfesor("");
    onHide();
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Nueva sección en {materiaNombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre de la cátedra</Form.Label>
            <Form.Control
              autoFocus
              placeholder="Ej: Cátedra B"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Profesor / perspectiva (opcional)</Form.Label>
            <Form.Control
              placeholder="Ej: Prof. Fernández"
              value={profesor}
              onChange={(e) => setProfesor(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Crear sección
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
