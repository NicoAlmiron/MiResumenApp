import { useState } from "react";
import { Card, Badge } from "react-bootstrap";

// Vista en tarjetas de los pedidos, para pantallas chicas (la tabla no entra
// bien ahí). Recibe los mismos `pedidos` ya filtrados que la tabla, así que
// los filtros se aplican igual — solo cambia cómo se muestran los resultados.
export default function PedidosTarjetas({ pedidos }) {
  if (pedidos.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay pedidos que coincidan con los filtros.</p>;
  }

  return (
    <div className="d-flex flex-column gap-2">
      {pedidos.map((pedido) => (
        <PedidoTarjeta key={pedido.id} pedido={pedido} />
      ))}
    </div>
  );
}

function PedidoTarjeta({ pedido }) {
  const [abierto, setAbierto] = useState(false);
  const [primero, ...resto] = pedido.resumenes;
  const tieneMas = resto.length > 0;

  return (
    <Card className="pedido-tarjeta">
      <Card.Body className="d-flex flex-column gap-2">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="fw-semibold">{pedido.contactoNombre}</div>
            <div className="text-body-secondary small">{pedido.contactoTelefono}</div>
          </div>
          {pedido.precio != null && (
            <Badge bg="success-subtle" text="success-emphasis" className="flex-shrink-0">
              ${pedido.precio}
            </Badge>
          )}
        </div>

        <div className="small">
          {primero.materiaNombre}{" "}
          <span className="text-body-secondary">
            · {primero.catedraNombre}
            {primero.comisionNombre ? ` · ${primero.comisionNombre}` : ""}
          </span>
        </div>

        {tieneMas && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-info rounded-pill align-self-start"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
            >
              <i className={`fa-solid ${abierto ? "fa-chevron-up" : "fa-chevron-down"} me-1`} aria-hidden="true" />
              {abierto ? "Ocultar resúmenes" : `+ ${resto.length} ${resto.length === 1 ? "resumen más" : "resúmenes más"}`}
            </button>
            {abierto && (
              <div className="d-flex flex-column gap-1">
                {resto.map((r, i) => (
                  <div key={i} className="small text-body-secondary ps-3 border-start border-2 border-info-subtle">
                    {r.materiaNombre} · {r.catedraNombre}
                    {r.comisionNombre ? ` · ${r.comisionNombre}` : ""}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-body-secondary small">
          <i className="fa-regular fa-calendar me-1" aria-hidden="true" />
          {pedido.fecha}
        </div>
      </Card.Body>
    </Card>
  );
}
