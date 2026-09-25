import { useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useMaterias, contarSecciones } from "../../context/MateriasContext";
import { labelAnio } from "../../utils/anioCursada";
import EditarMateriaModal from "./EditarMateriaModal";

export default function MateriasAdminTab() {
  const { materias, editarMateriaCompleta, eliminarMateria } = useMaterias();
  const [editando, setEditando] = useState(null);

  function handleEliminar(materia) {
    const confirmado = window.confirm(
      `¿Eliminar "${materia.nombre}"? Se borran también todas sus cátedras, comisiones y tableros.`
    );
    if (confirmado) eliminarMateria(materia.id);
  }

  if (materias.length === 0) {
    return <p className="text-body-secondary text-center py-4 mb-0">No hay materias cargadas.</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Año</th>
              <th>Cuatrimestre</th>
              <th>Secciones</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {materias.map((materia) => (
              <tr key={materia.id}>
                <td className="fw-semibold">{materia.nombre}</td>
                <td>{labelAnio(materia.anio)}</td>
                <td className="text-body-secondary">{materia.cuatrimestre}</td>
                <td>{contarSecciones(materia)}</td>
                <td className="text-end">
                  <Button variant="outline-info" size="sm" className="me-2" onClick={() => setEditando(materia)}>
                    <i className="bi bi-pencil-fill" aria-hidden="true" />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleEliminar(materia)}>
                    <i className="bi bi-trash-fill" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <EditarMateriaModal
        show={editando != null}
        onHide={() => setEditando(null)}
        materia={editando}
        onGuardar={(cambios) => editarMateriaCompleta(editando.id, cambios)}
      />
    </>
  );
}
