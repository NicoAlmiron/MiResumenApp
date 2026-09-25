import { Card, Badge } from "react-bootstrap";

// Tira horizontal con los últimos envíos (ya vienen ordenados, más nuevo
// primero). Es la vista rápida de arriba de todo en la pestaña Ventas.
export default function UltimosEnviosStrip({ envios }) {
  const ultimos = envios.slice(0, 5);

  if (ultimos.length === 0) {
    return (
      <p className="text-body-secondary small mb-0">
        Todavía no compartiste ningún resumen. Cuando compartas uno y registres el contacto, va a aparecer acá.
      </p>
    );
  }

  return (
    <div className="d-flex flex-nowrap gap-3 overflow-auto pb-2 ultimos-envios-strip">
      {ultimos.map((envio) => (
        <Card key={envio.id} className="ultimo-envio-card flex-shrink-0">
          <Card.Body className="d-flex flex-column gap-1 p-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-person-circle text-info" aria-hidden="true" />
              <span className="fw-semibold small text-truncate">{envio.contactoNombre}</span>
            </div>
            <div className="small text-truncate" title={`${envio.materiaNombre} · ${envio.resumenNombre}`}>
              {envio.materiaNombre} <span className="text-body-secondary">·</span> {envio.resumenNombre}
            </div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <span className="text-body-secondary" style={{ fontSize: "0.75rem" }}>
                {envio.fecha}
              </span>
              {envio.precio != null && (
                <Badge bg="success-subtle" text="success-emphasis">
                  ${envio.precio}
                </Badge>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
