import { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

export default function EditarComisionModal({ show, onHide, comision, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [turno, setTurno] = useState("");

  useEffect(() => {
    if (comision) {
      setNombre(comision.nombre);
      setTurno(comision.turno ?? "");
    }
  }, [comision]);

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ nombre: nombre.trim(), turno: turno.trim() });
    onHide();
  }

  if (!comision) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Editar comisión</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Turno</Form.Label>
            <Form.Control value={turno} onChange={(e) => setTurno(e.target.value)} />
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
