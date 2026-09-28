import { useState } from "react";
import { Card, Spinner } from "react-bootstrap";
import { descargarArchivoDelTablero } from "../../api/tableros";
import { iconoPorExtension } from "../../utils/iconoArchivo";

// Tarjeta de un archivo dentro de una columna del tablero. Arriba tiene dos
// "badges" circulares (estilo controles de ventana, pero acá son descargar/
// eliminar). `onMoverSiguiente` es null en la última columna. La descarga
// pega al backend, que a su vez lo pide a Drive con el token de quien lo
// subió — por eso es async, no un simple link directo.
export default function ArchivoCard({ archivo, dragging, onMoverSiguiente, onEliminar }) {
  const icono = iconoPorExtension(archivo.extension);
  const [descargando, setDescargando] = useState(false);

  async function handleDescargar(e) {
    e.stopPropagation();
    setDescargando(true);
    try {
      await descargarArchivoDelTablero(archivo.id, archivo.nombre);
    } finally {
      setDescargando(false);
    }
  }

  // Abre el visor de Drive en una pestaña nueva. Solo va a mostrar el
  // documento si quien hace click está logueado en Google con la MISMA
  // cuenta que lo subió (el archivo queda privado a propósito) — para
  // cualquier otro caso Drive va a pedir acceso; la descarga de arriba sigue
  // funcionando siempre, esa sí pasa por nuestro backend.
  function handleAbrirEnDrive(e) {
    e.stopPropagation();
    if (archivo.driveViewLink) window.open(archivo.driveViewLink, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className={`archivo-card position-relative mb-2 ${dragging ? "archivo-card--dragging" : ""}`}>
      <div className="archivo-card__controles">
        <button
          type="button"
          className="mini-badge-btn mini-badge-btn--descargar"
          title="Descargar"
          disabled={descargando}
          onClick={handleDescargar}
        >
          {descargando ? <Spinner animation="border" size="sm" /> : <i className="bi bi-download" aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="mini-badge-btn mini-badge-btn--eliminar"
          title="Eliminar"
          onClick={(e) => {
            e.stopPropagation();
            onEliminar();
          }}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>

      <Card.Body className="d-flex align-items-center gap-2 pt-4 pb-2 px-3">
        <span className="fs-5" aria-hidden="true" role="button" style={{ cursor: "pointer" }} onClick={handleAbrirEnDrive}>
          {icono}
        </span>
        <div
          className="flex-grow-1 overflow-hidden"
          role="button"
          style={{ cursor: "pointer" }}
          onClick={handleAbrirEnDrive}
        >
          <div className="small fw-semibold text-truncate" title="Abrir en Drive">
            {archivo.nombre}
          </div>
          <div className="text-body-secondary" style={{ fontSize: "0.75rem" }}>
            {archivo.fechaActualizado}
          </div>
        </div>
        {onMoverSiguiente && (
          <button
            type="button"
            className="btn btn-sm btn-outline-info rounded-circle archivo-card__mover"
            title="Mover a la siguiente columna"
            onClick={onMoverSiguiente}
          >
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </button>
        )}
      </Card.Body>
    </Card>
  );
}
