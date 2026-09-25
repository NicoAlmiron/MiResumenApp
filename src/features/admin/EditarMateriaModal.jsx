import { useEffect, useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { ANIOS_CURSADA, labelAnio } from "../../utils/anioCursada";

export default function EditarMateriaModal({ show, onHide, materia, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [anio, setAnio] = useState(ANIOS_CURSADA[0]);
  const [cuatrimestre, setCuatrimestre] = useState("1er cuatrimestre");
  const [descripcion, setDescripcion] = useState("");

  // Repone el formulario cada vez que se abre con una materia distinta.
  useEffect(() => {
    if (materia) {
      setNombre(materia.nombre);
      setAnio(materia.anio);
      setCuatrimestre(materia.cuatrimestre ?? "1er cuatrimestre");
      setDescripcion(materia.descripcion ?? "");
    }
  }, [materia]);

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ nombre: nombre.trim(), anio: Number(anio), cuatrimestre, descripcion: descripcion.trim() });
    onHide();
  }

  if (!materia) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Editar materia</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control value={nombre} onChange={(e) => setNombre(e.target.value)} required />
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
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
