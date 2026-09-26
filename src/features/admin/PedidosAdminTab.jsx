import { Table, Button, Badge, Spinner } from "react-bootstrap";
import { useMaterias } from "../../context/MateriasContext";

export default function PedidosAdminTab() {
  const { pedidos, cargandoPedidos, eliminarPedido } = useMaterias();

  function handleEliminar(pedido) {
    if (window.confirm(`¿Eliminar el pedido de "${pedido.contactoNombre}"?`)) eliminarPedido(pedido.id);
  }

  if (cargandoPedidos) {
    return (
      <div className="d-flex justify-content-center py-4">
        <Spinner animation="border" variant="info" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay pedidos registrados.</p>;
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
            <th className="text-end">Acciones</th>
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
                    <div key={i} className="small">
                      {r.materiaNombre}
                      <span className="text-body-secondary">
                        {" "}
                        · {r.catedraNombre}
                        {r.comisionNombre ? ` · ${r.comisionNombre}` : ""}
                      </span>
                    </div>
                  ))}
                  {pedido.resumenes.length > 1 && (
                    <Badge bg="primary-subtle" text="primary-emphasis" className="align-self-start">
                      {pedido.resumenes.length} juntos
                    </Badge>
                  )}
                </div>
              </td>
              <td>{pedido.precio != null ? `$${pedido.precio}` : <span className="text-body-secondary">—</span>}</td>
              <td className="text-body-secondary">{pedido.fecha}</td>
              <td className="text-end">
                <Button variant="outline-danger" size="sm" onClick={() => handleEliminar(pedido)}>
                  <i className="bi bi-trash-fill" aria-hidden="true" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
