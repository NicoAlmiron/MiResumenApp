import { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ETIQUETA_ROL } from "../../data/authMockData";

// Un "boss" puede dar de alta gente, pero no puede crear otro administrador
// (esa jerarquía queda reservada a quien ya es administrador).
function rolesDisponibles(rolDeQuienCrea) {
  return rolDeQuienCrea === ROLES.ADMINISTRADOR
    ? [ROLES.ADMINISTRADOR, ROLES.BOSS, ROLES.USUARIO]
    : [ROLES.BOSS, ROLES.USUARIO];
}

export default function CrearUsuarioModal({ show, onHide }) {
  const { usuario, crearUsuario } = useAuth();
  const opciones = rolesDisponibles(usuario.rol);

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(opciones[opciones.length - 1]); // el más "chico" por defecto
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  function limpiarYCerrar() {
    setNombreUsuario("");
    setPassword("");
    setRol(opciones[opciones.length - 1]);
    setError("");
    setOk(false);
    onHide();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = crearUsuario({ nombreUsuario: nombreUsuario.trim(), password, rol });
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setOk(true);
    setNombreUsuario("");
    setPassword("");
  }

  return (
    <Modal show={show} onHide={limpiarYCerrar} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill" aria-hidden="true" />
            Crear usuario nuevo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          {error && (
            <Alert variant="danger" className="py-2 small mb-0">
              {error}
            </Alert>
          )}
          {ok && (
            <Alert variant="success" className="py-2 small mb-0">
              Usuario creado. Podés cargar otro o cerrar este cuadro.
            </Alert>
          )}

          <Form.Group>
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              autoFocus
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              required
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Rol</Form.Label>
            <Form.Select value={rol} onChange={(e) => setRol(e.target.value)}>
              {opciones.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={limpiarYCerrar}>
            Cerrar
          </Button>
          <Button variant="primary" type="submit">
            Crear usuario
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
