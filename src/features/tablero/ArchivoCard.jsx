import { Card } from "react-bootstrap";

const ICONOS_POR_EXTENSION = {
  pdf: "📕",
  doc: "📄",
  docx: "📄",
  xlsx: "📊",
  xls: "📊",
  pptx: "📽️",
  ppt: "📽️",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
};

// Descarga el File real del navegador (si lo tenemos) generando un link temporal.
function descargar(archivo) {
  const url = URL.createObjectURL(archivo.archivoOriginal);
  const link = document.createElement("a");
  link.href = url;
  link.download = archivo.nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Tarjeta de un archivo dentro de una columna del tablero. Arriba tiene dos
// "badges" circulares (estilo controles de ventana, pero acá son descargar/
// eliminar). `onMoverSiguiente` es null en la última columna. La descarga solo
// funciona si tenemos el archivo real (`archivoOriginal`): los datos de
// ejemplo y las copias "convertidas" a PDF no tienen bytes reales detrás.
export default function ArchivoCard({ archivo, dragging, onMoverSiguiente, onEliminar }) {
  const icono = ICONOS_POR_EXTENSION[archivo.extension?.toLowerCase()] ?? "📎";
  const puedeDescargar = Boolean(archivo.archivoOriginal);

  return (
    <Card className={`archivo-card position-relative mb-2 ${dragging ? "archivo-card--dragging" : ""}`}>
      <div className="archivo-card__controles">
        <button
          type="button"
          className="mini-badge-btn mini-badge-btn--descargar"
          title={puedeDescargar ? "Descargar" : "Sin archivo real para descargar (dato de ejemplo)"}
          disabled={!puedeDescargar}
          onClick={(e) => {
            e.stopPropagation();
            if (puedeDescargar) descargar(archivo);
          }}
        >
          <i className="bi bi-download" aria-hidden="true" />
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
        <span className="fs-5" aria-hidden="true">
          {icono}
        </span>
        <div className="flex-grow-1 overflow-hidden">
          <div className="small fw-semibold text-truncate" title={archivo.nombre}>
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
