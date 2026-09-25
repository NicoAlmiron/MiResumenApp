import { Table } from "react-bootstrap";

export default function EnviosTabla({ envios }) {
  if (envios.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay envíos que coincidan con los filtros.</p>;
  }

  return (
    <div className="table-responsive">
      <Table hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Resumen</th>
            <th>Precio</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {envios.map((envio) => (
            <tr key={envio.id}>
              <td className="fw-semibold">{envio.contactoNombre}</td>
              <td className="text-body-secondary">{envio.contactoTelefono}</td>
              <td>
                {envio.materiaNombre}
                <div className="text-body-secondary small">
                  {envio.catedraNombre}
                  {envio.comisionNombre ? ` · ${envio.comisionNombre}` : ""}
                </div>
              </td>
              <td>{envio.precio != null ? `$${envio.precio}` : <span className="text-body-secondary">—</span>}</td>
              <td className="text-body-secondary">{envio.fecha}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
