import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useMaterias, getHoja, refHojaKey } from "../../context/MateriasContext";
import RegistrarContactoModal from "../ventas/RegistrarContactoModal";

// Modal que se abre desde el botón de "cola de envío" del navbar: lista los
// resúmenes que se fueron marcando con "Preparar envío" en cualquier parte
// de la app, cada uno con su mini-botón de eliminar (misma clase .mini-badge-btn
// que usan las tarjetas de archivo del tablero). "Compartir todo" pide UN
// contacto (RegistrarContactoModal) y registra un envío por cada resumen.
export default function ColaEnvioModal({ show, onHide }) {
  const { materias, colaEnvio, quitarDeColaEnvio, compartirCola } = useMaterias();
  const [showContacto, setShowContacto] = useState(false);

  function handleConfirmarContacto(contacto) {
    compartirCola(contacto);
    onHide();
  }

  return (
    <>
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <i className="bi bi-send-fill" aria-hidden="true" />
            Resúmenes seleccionados
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {colaEnvio.length === 0 ? (
            <p className="text-body-secondary text-center mb-0 py-3">
              Todavía no preparaste ningún resumen para enviar. Usá el botón "Preparar envío" en cualquier resumen
              listo para ir sumándolo acá.
            </p>
          ) : (
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              {colaEnvio.map((ref) => {
                const materia = materias.find((m) => m.id === ref.materiaId);
                const hoja = getHoja(materias, ref);
                if (!materia || !hoja) return null;
                return (
                  <li
                    key={refHojaKey(ref)}
                    className="d-flex align-items-center justify-content-between gap-2 border border-secondary-subtle rounded-3 px-3 py-2"
                  >
                    <span className="small">
                      <span className="fw-semibold">{materia.nombre}</span>
                      <span className="text-body-secondary"> · {hoja.nombre}</span>
                    </span>
                    <button
                      type="button"
                      className="mini-badge-btn mini-badge-btn--eliminar"
                      title="Quitar de la lista"
                      onClick={() => quitarDeColaEnvio(ref)}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onHide}>
            Cancelar
          </Button>
          <Button
            variant="success"
            className="fw-semibold"
            disabled={colaEnvio.length === 0}
            onClick={() => setShowContacto(true)}
          >
            <i className="bi bi-share-fill me-1" aria-hidden="true" />
            Compartir todo
          </Button>
        </Modal.Footer>
      </Modal>

      <RegistrarContactoModal
        show={showContacto}
        onHide={() => setShowContacto(false)}
        cantidadResumenes={colaEnvio.length}
        onConfirmar={handleConfirmarContacto}
      />
    </>
  );
}
