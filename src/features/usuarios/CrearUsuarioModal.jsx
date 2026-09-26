import { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ETIQUETA_ROL } from "../../data/authMockData";
import SelectDropdown from "../../components/SelectDropdown";

// Un "boss" puede dar de alta gente, pero no puede crear otro administrador
// (esa jerarquía queda reservada a quien ya es administrador).
function rolesDisponibles(rolDeQuienCrea) {
  return rolDeQuienCrea === ROLES.ADMINISTRADOR
    ? [ROLES.ADMINISTRADOR, ROLES.BOSS, ROLES.USUARIO]
    : [ROLES.BOSS, ROLES.USUARIO];
}

export default function CrearUsuarioModal({ show, onHide }) {
  const { usuario, crearUsuario } = useAuth();
  const rolesPermitidos = rolesDisponibles(usuario.rol);

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(rolesPermitidos[rolesPermitidos.length - 1]); // el más "chico" por defecto
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function limpiarYCerrar() {
    setNombreUsuario("");
    setPassword("");
    setRol(rolesPermitidos[rolesPermitidos.length - 1]);
    setError("");
    setOk(false);
    onHide();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    const err = await crearUsuario({ nombreUsuario: nombreUsuario.trim(), password, rol });
    setEnviando(false);
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
            <SelectDropdown
              value={rol}
              onChange={setRol}
              opciones={rolesPermitidos.map((r) => ({ value: r, label: ETIQUETA_ROL[r] }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={limpiarYCerrar}>
            Cerrar
          </Button>
          <Button variant="primary" type="submit" disabled={enviando}>
            Crear usuario
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
