import { useState } from "react";
import { Table, Form, Button, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ETIQUETA_ROL } from "../../data/authMockData";

export default function UsuariosAdminTab() {
  const { usuario, usuarios, cambiarRolUsuario, eliminarUsuario } = useAuth();
  const [error, setError] = useState("");

  function handleCambiarRol(id, nuevoRol) {
    const err = cambiarRolUsuario(id, nuevoRol);
    setError(err ?? "");
  }

  function handleEliminar(u) {
    if (!window.confirm(`¿Eliminar el usuario "${u.nombreUsuario}"?`)) return;
    const err = eliminarUsuario(u.id);
    setError(err ?? "");
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
                    <Form.Select
                      size="sm"
                      value={u.rol}
                      onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                    >
                      {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                          {ETIQUETA_ROL[r]}
                        </option>
                      ))}
                    </Form.Select>
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
