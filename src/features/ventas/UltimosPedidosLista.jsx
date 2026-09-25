import { Card, Badge } from "react-bootstrap";

// Lista vertical (para el costado de la página) con los últimos pedidos, ya
// ordenados más nuevo primero. Cada pedido puede tener varios resúmenes
// adentro (se mandaron juntos), por eso se muestra la cuenta + el primero.
export default function UltimosPedidosLista({ pedidos }) {
  const ultimos = pedidos.slice(0, 6);

  if (ultimos.length === 0) {
    return (
      <p className="text-body-secondary small mb-0">
        Todavía no compartiste ningún resumen. Cuando compartas uno y registres el contacto, va a aparecer acá.
      </p>
    );
  }

  return (
    <div className="d-flex flex-column gap-2 ultimos-pedidos-lista">
      {ultimos.map((pedido) => {
        const [primero, ...resto] = pedido.resumenes;
        return (
          <Card key={pedido.id} className="ultimo-pedido-card">
            <Card.Body className="d-flex flex-column gap-1 p-3">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <span className="d-flex align-items-center gap-2 fw-semibold small text-truncate">
                  <i className="bi bi-person-circle text-info" aria-hidden="true" />
                  {pedido.contactoNombre}
                </span>
                {pedido.precio != null && (
                  <Badge bg="success-subtle" text="success-emphasis" className="flex-shrink-0">
                    ${pedido.precio}
                  </Badge>
                )}
              </div>
              <div className="small text-truncate" title={`${primero.materiaNombre} · ${primero.resumenNombre}`}>
                {primero.materiaNombre} <span className="text-body-secondary">·</span> {primero.resumenNombre}
              </div>
              {resto.length > 0 && (
                <div className="text-body-secondary" style={{ fontSize: "0.75rem" }}>
                  + {resto.length} {resto.length === 1 ? "resumen más" : "resúmenes más"}
                </div>
              )}
              <div className="text-body-secondary" style={{ fontSize: "0.75rem" }}>
                {pedido.fecha}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
