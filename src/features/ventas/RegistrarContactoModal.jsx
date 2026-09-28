import { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { useMaterias, contactosGuardados } from "../../context/MateriasContext";
import { soportaContactPicker, elegirContacto } from "../../utils/contactPicker";

// Modal genérico que se abre desde CUALQUIER botón "Compartir" de la app
// (fila de Cátedra/Comisión, Tablero, "Compartir todo" de la cola). Pide el
// contacto del compañero al que se le manda el resumen — obligatorio nombre
// y teléfono, precio opcional — y lo autocompleta con contactos ya usados.
export default function RegistrarContactoModal({ show, onHide, cantidadResumenes = 1, onConfirmar }) {
  const { pedidos } = useMaterias();
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [precio, setPrecio] = useState("");

  const contactos = contactosGuardados(pedidos);

  function limpiarYCerrar() {
    setContactoNombre("");
    setContactoTelefono("");
    setPrecio("");
    onHide();
  }

  async function handleElegirContacto() {
    const elegido = await elegirContacto().catch(() => null);
    if (!elegido) return;
    setContactoNombre(elegido.nombre);
    setContactoTelefono(elegido.telefono);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!contactoNombre.trim() || !contactoTelefono.trim()) return;
    onConfirmar({
      contactoNombre: contactoNombre.trim(),
      contactoTelefono: contactoTelefono.trim(),
      precio: precio === "" ? null : Number(precio),
    });
    limpiarYCerrar();
  }

  return (
    <Modal show={show} onHide={limpiarYCerrar} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <i className="bi bi-person-lines-fill" aria-hidden="true" />
            ¿A quién se lo compartís?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          <p className="text-body-secondary small mb-0">
            Vas a compartir {cantidadResumenes} {cantidadResumenes === 1 ? "resumen" : "resúmenes"}. Registrá el
            contacto para que quede en Ventas.
          </p>

          {soportaContactPicker() && (
            <Button variant="outline-info" size="sm" className="align-self-start" onClick={handleElegirContacto}>
              <i className="bi bi-person-lines-fill me-1" aria-hidden="true" />
              Elegir de mis contactos
            </Button>
          )}

          <Form.Group>
            <Form.Label>Nombre del compañero/a</Form.Label>
            <Form.Control
              autoFocus
              list="contactos-guardados-nombre"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              placeholder="Ej: Julieta Sosa"
              required
            />
            <datalist id="contactos-guardados-nombre">
              {contactos.map((c) => (
                <option key={c.telefono || c.nombre} value={c.nombre} />
              ))}
            </datalist>
          </Form.Group>

          <Row className="g-3">
            <Col sm={7}>
              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  list="contactos-guardados-telefono"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="381 555-1234"
                  required
                />
                <datalist id="contactos-guardados-telefono">
                  {contactos.map((c) => (
                    <option key={c.telefono || c.nombre} value={c.telefono} />
                  ))}
                </datalist>
              </Form.Group>
            </Col>
            <Col sm={5}>
              <Form.Group>
                <Form.Label>Precio (opcional)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="$"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={limpiarYCerrar}>
            Cancelar
          </Button>
          <Button variant="success" type="submit" className="fw-semibold">
            <i className="bi bi-share-fill me-1" aria-hidden="true" />
            Compartir
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
