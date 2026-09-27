import { Card, Spinner } from "react-bootstrap";
import { iconoPorExtension } from "../../utils/iconoArchivo";

// Tarjeta "fantasma" mientras un archivo se está subiendo de verdad a Drive
// (puede tardar unos segundos) — mismo layout que ArchivoCard, sin acciones,
// para que quede claro que todavía no está listo.
export default function ArchivoCardSubiendo({ nombre }) {
  const extension = nombre.includes(".") ? nombre.slice(nombre.lastIndexOf(".") + 1) : null;
  const icono = iconoPorExtension(extension);

  return (
    <Card className="archivo-card archivo-card--subiendo position-relative mb-2">
      <Card.Body className="d-flex align-items-center gap-2 py-2 px-3">
        <span className="fs-5" aria-hidden="true">
          {icono}
        </span>
        <div className="flex-grow-1 overflow-hidden">
          <div className="small fw-semibold text-truncate" title={nombre}>
            {nombre}
          </div>
          <div className="text-info" style={{ fontSize: "0.75rem" }}>
            Subiendo a Drive...
          </div>
        </div>
        <Spinner animation="border" size="sm" variant="info" role="status">
          <span className="visually-hidden">Subiendo...</span>
        </Spinner>
      </Card.Body>
    </Card>
  );
}
