import { useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useMaterias } from "../../context/MateriasContext";
import EditarCatedraModal from "./EditarCatedraModal";

export default function CatedrasAdminTab() {
  const { materias, editarCatedraCompleta, eliminarCatedra } = useMaterias();
  const [editando, setEditando] = useState(null); // { materiaId, ...catedra }

  const filas = materias.flatMap((materia) =>
    materia.catedras.map((catedra) => ({ materiaId: materia.id, materiaNombre: materia.nombre, ...catedra }))
  );

  function handleEliminar(fila) {
    const confirmado = window.confirm(
      `¿Eliminar la cátedra "${fila.nombre}" de ${fila.materiaNombre}? Se borran también sus comisiones y tableros.`
    );
    if (confirmado) eliminarCatedra(fila.materiaId, fila.id);
  }

  if (filas.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay cátedras cargadas.</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Cátedra</th>
              <th>Profesor</th>
              <th>Comisiones</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={`${fila.materiaId}-${fila.id}`}>
                <td>{fila.materiaNombre}</td>
                <td className="fw-semibold">{fila.nombre}</td>
                <td className="text-body-secondary">{fila.profesor || "—"}</td>
                <td>{fila.comisiones.length}</td>
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

      <EditarCatedraModal
        show={editando != null}
        onHide={() => setEditando(null)}
        catedra={editando}
        onGuardar={(cambios) => editarCatedraCompleta(editando.materiaId, editando.id, cambios)}
      />
    </>
  );
}
