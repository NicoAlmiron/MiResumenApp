import { useState, useEffect, useCallback } from "react";
import { Table, Button, Alert, Badge, Spinner } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ETIQUETA_ROL } from "../../data/authMockData";
import SelectDropdown from "../../components/SelectDropdown";

export default function UsuariosAdminTab() {
  const { usuario, listarUsuarios, cambiarRolUsuario, eliminarUsuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setCargando(true);
    listarUsuarios()
      .then(setUsuarios)
      .finally(() => setCargando(false));
  }, [listarUsuarios]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCambiarRol(id, nuevoRol) {
    const err = await cambiarRolUsuario(id, nuevoRol);
    setError(err ?? "");
    if (!err) cargar();
  }

  async function handleEliminar(u) {
    if (!window.confirm(`¿Eliminar el usuario "${u.nombreUsuario}"?`)) return;
    const err = await eliminarUsuario(u.id);
    setError(err ?? "");
    if (!err) cargar();
  }

  if (cargando) {
    return (
      <div className="d-flex justify-content-center py-4">
        <Spinner animation="border" variant="info" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" className="py-2 small" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const esUnoMismo = u.id === usuario.id;
              return (
                <tr key={u.id}>
                  <td className="fw-semibold">
                    {u.nombreUsuario} {esUnoMismo && <Badge bg="secondary">vos</Badge>}
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <SelectDropdown
                      size="sm"
                      value={u.rol}
                      onChange={(valor) => handleCambiarRol(u.id, valor)}
                      opciones={Object.values(ROLES).map((r) => ({ value: r, label: ETIQUETA_ROL[r] }))}
                    />
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      disabled={esUnoMismo}
                      title={esUnoMismo ? "No podés eliminar tu propio usuario" : "Eliminar"}
                      onClick={() => handleEliminar(u)}
                    >
                      <i className="bi bi-trash-fill" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </>
  );
}
