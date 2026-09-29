import { useState, useEffect } from "react";
import { Modal, Form, Button, ButtonGroup, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import { useMaterias, contactosGuardados } from "../../context/MateriasContext";
import { soportaContactPicker, elegirContacto } from "../../utils/contactPicker";
import { soportaCompartirArchivos, armarMensajeWhatsapp, compartirPorWhatsapp } from "../../utils/whatsappShare";
import { ApiError } from "../../api/client";

// Modal genérico que se abre desde CUALQUIER botón "Compartir" de la app
// (fila de Cátedra/Comisión, Tablero, "Compartir todo" de la cola). Deja
// elegir un Cliente ya registrado, o cargar uno nuevo (a mano o desde la
// agenda del teléfono) que se auto-registra en la misma operación — precio
// opcional, y dos formas de terminar: "Compartir" (solo registra el pedido)
// o "Por WhatsApp" (registra Y abre WhatsApp con el mensaje/archivo real).
export default function RegistrarContactoModal({ show, onHide, archivos = [], onConfirmar }) {
  const { pedidos, clientes } = useMaterias();
  const [modo, setModo] = useState("nuevo"); // "existente" | "nuevo"
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [precio, setPrecio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const contactos = contactosGuardados(pedidos);
  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    return !q || c.nombre.toLowerCase().includes(q) || c.telefono.includes(q);
  });

  // Cada vez que se abre, recalcula el modo por default (existente si ya hay
  // clientes cargados) y limpia lo que haya quedado de una apertura anterior.
  useEffect(() => {
    if (!show) return;
    setModo(clientes.length > 0 ? "existente" : "nuevo");
    setBusqueda("");
    setClienteSeleccionadoId(null);
    setContactoNombre("");
    setContactoTelefono("");
    setPrecio("");
    setError(null);
  }, [show, clientes.length]);

  function limpiarYCerrar() {
    onHide();
  }

  async function handleElegirContacto() {
    const elegido = await elegirContacto().catch(() => null);
    if (!elegido) return;
    setContactoNombre(elegido.nombre);
    setContactoTelefono(elegido.telefono);
  }

  const puedeEnviar =
    modo === "existente" ? clienteSeleccionadoId != null : contactoNombre.trim() !== "" && contactoTelefono.trim() !== "";

  function datosContacto() {
    const precioNumerico = precio === "" ? null : Number(precio);
    if (modo === "existente") {
      return { clienteId: clienteSeleccionadoId, precio: precioNumerico };
    }
    return {
      clienteNuevo: { nombre: contactoNombre.trim(), telefono: contactoTelefono.trim() },
      precio: precioNumerico,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeEnviar || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar(datosContacto());
      limpiarYCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleCompartirWhatsapp() {
    if (!puedeEnviar || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const pedido = await onConfirmar(datosContacto());
      const mensaje = armarMensajeWhatsapp({
        clienteNombre: pedido.contactoNombre,
        archivos,
        precio: pedido.precio,
      });
      await compartirPorWhatsapp({ mensaje, archivos, telefono: pedido.contactoTelefono });
      limpiarYCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el pedido.");
    } finally {
      setEnviando(false);
    }
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
            Vas a compartir {archivos.length} {archivos.length === 1 ? "resumen" : "resúmenes"}.
          </p>

          {error && (
            <Alert variant="danger" className="py-2 small mb-0">
              {error}
            </Alert>
          )}

          {clientes.length > 0 && (
            <ButtonGroup>
              <Button variant={modo === "existente" ? "info" : "outline-info"} onClick={() => setModo("existente")}>
                Cliente existente
              </Button>
              <Button variant={modo === "nuevo" ? "info" : "outline-info"} onClick={() => setModo("nuevo")}>
                Contacto nuevo
              </Button>
            </ButtonGroup>
          )}

          {modo === "existente" ? (
            <div className="d-flex flex-column gap-2">
              <Form.Control
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
              />
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                {clientesFiltrados.length === 0 && (
                  <p className="text-body-secondary small text-center mb-0 py-2">Sin resultados.</p>
                )}
                {clientesFiltrados.map((c) => (
                  <Card
                    key={c.id}
                    role="button"
                    onClick={() => setClienteSeleccionadoId(c.id)}
                    className={`p-2 ${c.id === clienteSeleccionadoId ? "border-info border-2" : ""}`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle fs-4 text-info" aria-hidden="true" />
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{c.nombre}</div>
                        <div className="text-body-secondary small">{c.telefono}</div>
                      </div>
                      {c.id === clienteSeleccionadoId && (
                        <i className="bi bi-check-circle-fill text-success" aria-hidden="true" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
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
                />
                <datalist id="contactos-guardados-nombre">
                  {contactos.map((c) => (
                    <option key={c.telefono || c.nombre} value={c.nombre} />
                  ))}
                </datalist>
              </Form.Group>

              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  list="contactos-guardados-telefono"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="381 555-1234"
                />
                <datalist id="contactos-guardados-telefono">
                  {contactos.map((c) => (
                    <option key={c.telefono || c.nombre} value={c.telefono} />
                  ))}
                </datalist>
              </Form.Group>
            </>
          )}

          <Row className="g-3">
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
          <Button variant="outline-light" onClick={limpiarYCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant="outline-success"
            disabled={!puedeEnviar || enviando}
            onClick={handleCompartirWhatsapp}
            title={soportaCompartirArchivos() ? "Adjunta el archivo real" : "Abre WhatsApp con el mensaje (sin archivo)"}
          >
            {enviando ? (
              <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <i className="bi bi-whatsapp me-1" aria-hidden="true" />
                Por WhatsApp
              </>
            )}
          </Button>
          <Button variant="success" type="submit" className="fw-semibold" disabled={!puedeEnviar || enviando}>
            <i className="bi bi-share-fill me-1" aria-hidden="true" />
            Compartir
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
