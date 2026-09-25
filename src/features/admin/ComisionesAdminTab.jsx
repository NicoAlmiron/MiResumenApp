import { useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useMaterias } from "../../context/MateriasContext";
import EditarComisionModal from "./EditarComisionModal";

export default function ComisionesAdminTab() {
  const { materias, editarComision, eliminarComision } = useMaterias();
  const [editando, setEditando] = useState(null); // { materiaId, catedraId, ...comision }

  const filas = materias.flatMap((materia) =>
    materia.catedras.flatMap((catedra) =>
      catedra.comisiones.map((comision) => ({
        materiaId: materia.id,
        materiaNombre: materia.nombre,
        catedraId: catedra.id,
        catedraNombre: catedra.nombre,
        ...comision,
      }))
    )
  );

  function handleEliminar(fila) {
    const confirmado = window.confirm(`¿Eliminar la comisión "${fila.nombre}" de ${fila.catedraNombre}?`);
    if (confirmado) eliminarComision(fila.materiaId, fila.catedraId, fila.id);
  }

  if (filas.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay comisiones cargadas.</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Cátedra</th>
              <th>Comisión</th>
              <th>Turno</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={`${fila.catedraId}-${fila.id}`}>
                <td>{fila.materiaNombre}</td>
                <td className="text-body-secondary">{fila.catedraNombre}</td>
                <td className="fw-semibold">{fila.nombre}</td>
                <td className="text-body-secondary">{fila.turno || "—"}</td>
                <td className="text-end">
                  <Button variant="outline-info" size="sm" className="me-2" onClick={() => setEditando(fila)}>
                    <i className="bi bi-pencil-fill" aria-hidden="true" />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleEliminar(fila)}>
                    <i className="bi bi-trash-fill" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <EditarComisionModal
        show={editando != null}
        onHide={() => setEditando(null)}
        comision={editando}
        onGuardar={(cambios) => editarComision(editando.materiaId, editando.catedraId, editando.id, cambios)}
      />
    </>
  );
}
