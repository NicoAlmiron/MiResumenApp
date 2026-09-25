import { useState } from "react";
import { Button } from "react-bootstrap";
import { useMaterias, refHojaKey } from "../../context/MateriasContext";
import RegistrarContactoModal from "../ventas/RegistrarContactoModal";

// Botones de estado de una "hoja" (Cátedra sin Comisiones, o una Comisión):
// - "Seguir editando" (amarillo) navega al Tablero Kanban de esa hoja.
// - "Compartir" (verde) abre el modal de contacto (RegistrarContactoModal) y
//   recién ahí se comparte de verdad. "Preparar envío" (cián) arrancan
//   deshabilitados y se habilitan solo cuando ya hay un archivo en "Listo".
// `refHoja` identifica la hoja en el Context (null en el caso especial de una
// Materia sin ninguna sección todavía, donde estos botones son solo visuales).
export default function SeccionButtons({ refHoja, estaListo, vecesCompartido, onSeguirPreparando }) {
  const { registrarPedido, colaEnvio, agregarAColaEnvio, quitarDeColaEnvio } = useMaterias();
  const [showContacto, setShowContacto] = useState(false);
  const enCola = refHoja != null && colaEnvio.some((r) => refHojaKey(r) === refHojaKey(refHoja));

  return (
    <div className="d-flex align-items-center flex-wrap gap-2">
      <Button variant="warning" size="sm" className="btn-seccion fw-semibold rounded-pill" onClick={onSeguirPreparando}>
        <i className="bi bi-pencil-fill me-1" aria-hidden="true" />
        Seguir editando
      </Button>

      <Button
        variant={estaListo ? "success" : "outline-secondary"}
        size="sm"
        className="btn-seccion fw-semibold rounded-pill"
        disabled={!estaListo}
        onClick={() => setShowContacto(true)}
      >
        <i className="bi bi-share-fill me-1" aria-hidden="true" />
        Compartir
      </Button>

      <Button
        variant={enCola ? "info" : "outline-info"}
        size="sm"
        className="btn-seccion fw-semibold rounded-pill"
        disabled={!estaListo}
        onClick={() => (enCola ? quitarDeColaEnvio(refHoja) : agregarAColaEnvio(refHoja))}
      >
        <i className={`bi ${enCola ? "bi-check-circle-fill" : "bi-send-plus-fill"} me-1`} aria-hidden="true" />
        {enCola ? "En la lista" : "Preparar envío"}
      </Button>

      <span className="text-body-secondary small d-inline-flex align-items-center gap-1">
        <i className="bi bi-arrow-repeat" aria-hidden="true" />
        {vecesCompartido} {vecesCompartido === 1 ? "vez compartido" : "veces compartido"}
      </span>

      <RegistrarContactoModal
        show={showContacto}
        onHide={() => setShowContacto(false)}
        cantidadResumenes={1}
        onConfirmar={(contacto) => registrarPedido([refHoja], contacto)}
      />
    </div>
  );
}
