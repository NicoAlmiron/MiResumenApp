import { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

export default function EditarCatedraModal({ show, onHide, catedra, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [profesor, setProfesor] = useState("");

  useEffect(() => {
    if (catedra) {
      setNombre(catedra.nombre);
      setProfesor(catedra.profesor ?? "");
    }
  }, [catedra]);

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ nombre: nombre.trim(), profesor: profesor.trim() });
    onHide();
  }

  if (!catedra) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Editar cátedra</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Profesor / perspectiva</Form.Label>
            <Form.Control value={profesor} onChange={(e) => setProfesor(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar cambios
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
