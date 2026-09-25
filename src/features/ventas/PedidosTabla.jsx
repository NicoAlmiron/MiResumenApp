import { Table, Badge } from "react-bootstrap";

// Cada fila es un PEDIDO (no un resumen suelto): si se compartieron varios
// resúmenes juntos (por ejemplo desde "Compartir todo" de la cola), todos
// aparecen agrupados en la misma fila, en vez de una fila por cada uno.
export default function PedidosTabla({ pedidos }) {
  if (pedidos.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay pedidos que coincidan con los filtros.</p>;
  }

  return (
    <div className="table-responsive">
      <Table hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Resúmenes</th>
            <th>Precio</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td className="fw-semibold">{pedido.contactoNombre}</td>
              <td className="text-body-secondary">{pedido.contactoTelefono}</td>
              <td>
                <div className="d-flex flex-column gap-1">
                  {pedido.resumenes.map((r, i) => (
                    <div key={i} className="d-flex align-items-center gap-2">
                      <span>{r.materiaNombre}</span>
                      <span className="text-body-secondary small">
                        {r.catedraNombre}
                        {r.comisionNombre ? ` · ${r.comisionNombre}` : ""}
                      </span>
                    </div>
                  ))}
                  {pedido.resumenes.length > 1 && (
                    <Badge bg="primary-subtle" text="primary-emphasis" className="align-self-start">
                      {pedido.resumenes.length} resúmenes juntos
                    </Badge>
                  )}
                </div>
              </td>
              <td>{pedido.precio != null ? `$${pedido.precio}` : <span className="text-body-secondary">—</span>}</td>
              <td className="text-body-secondary">{pedido.fecha}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
