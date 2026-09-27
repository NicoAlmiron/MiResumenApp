import { useState } from "react";
import { Container, Card, Form, Button, Alert, Badge, Spinner } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { ETIQUETA_ROL, ROLES } from "../data/authMockData";

export default function ConfiguracionPage() {
  const { usuario, cambiarNombreUsuario, cambiarPassword, vincularGoogle, desvincularGoogle } = useAuth();
  // El rol "usuario" solo usa Herramientas — no le corresponde nada de
  // Google Drive/Contactos, así que ni le mostramos esa sección.
  const esUsuario = usuario.rol === ROLES.USUARIO;

  const [nombreNuevo, setNombreNuevo] = useState(usuario.nombreUsuario);
  const [mensajeNombre, setMensajeNombre] = useState(null); // { tipo, texto }

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [mensajePassword, setMensajePassword] = useState(null);

  const [mensajeGoogle, setMensajeGoogle] = useState(null);
  const [vinculandoGoogle, setVinculandoGoogle] = useState(false);

  async function handleNombre(e) {
    e.preventDefault();
    const err = await cambiarNombreUsuario(nombreNuevo.trim());
    setMensajeNombre(err ? { tipo: "danger", texto: err } : { tipo: "success", texto: "Nombre de usuario actualizado." });
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (passwordNueva !== passwordConfirmar) {
      setMensajePassword({ tipo: "danger", texto: "La confirmación no coincide con la contraseña nueva." });
      return;
    }
    const err = await cambiarPassword(passwordActual, passwordNueva);
    if (err) {
      setMensajePassword({ tipo: "danger", texto: err });
      return;
    }
    setMensajePassword({ tipo: "success", texto: "Contraseña actualizada." });
    setPasswordActual("");
    setPasswordNueva("");
    setPasswordConfirmar("");
  }

  async function handleGoogleSuccess(credentialResponse) {
    setVinculandoGoogle(true);
    const err = await vincularGoogle(credentialResponse.credential);
    setVinculandoGoogle(false);
    setMensajeGoogle(err ? { tipo: "danger", texto: err } : { tipo: "success", texto: "Cuenta de Google vinculada." });
  }

  async function handleDesvincularGoogle() {
    setVinculandoGoogle(true);
    const err = await desvincularGoogle();
    setVinculandoGoogle(false);
    setMensajeGoogle(err ? { tipo: "danger", texto: err } : { tipo: "success", texto: "Cuenta de Google desvinculada." });
  }

  return (
    <Container className="py-4 d-flex flex-column gap-3" style={{ maxWidth: 560 }}>
      <div>
        <h4 className="mb-1">
          <i className="bi bi-gear-fill me-2 text-info" aria-hidden="true" />
          Configuración
        </h4>
        <p className="text-body-secondary mb-0">
          Sesión actual: <strong>{usuario.nombreUsuario}</strong>{" "}
          <Badge bg="info-subtle" text="info-emphasis">
            {ETIQUETA_ROL[usuario.rol]}
          </Badge>
        </p>
      </div>

      <Card>
        <Card.Body className="d-flex flex-column gap-3">
          <Card.Title as="h6">Nombre de usuario</Card.Title>
          {mensajeNombre && (
            <Alert variant={mensajeNombre.tipo} className="py-2 small mb-0">
              {mensajeNombre.texto}
            </Alert>
          )}
          <Form onSubmit={handleNombre} className="d-flex gap-2 align-items-end flex-wrap">
            <Form.Group className="flex-grow-1">
              <Form.Label className="small">Nuevo nombre</Form.Label>
              <Form.Control value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} required />
            </Form.Group>
            <Button type="submit" variant="primary">
              Guardar
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="d-flex flex-column gap-3">
          <Card.Title as="h6">Cambiar contraseña</Card.Title>
          {mensajePassword && (
            <Alert variant={mensajePassword.tipo} className="py-2 small mb-0">
              {mensajePassword.texto}
            </Alert>
          )}
          <Form onSubmit={handlePassword} className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="small">Contraseña actual</Form.Label>
              <Form.Control
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Contraseña nueva</Form.Label>
              <Form.Control
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                minLength={4}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Confirmar contraseña nueva</Form.Label>
              <Form.Control
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="align-self-start">
              Cambiar contraseña
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {!esUsuario && (
        <Card>
          <Card.Body className="d-flex flex-column gap-3">
            <Card.Title as="h6">Cuenta de Google</Card.Title>
            {mensajeGoogle && (
              <Alert variant={mensajeGoogle.tipo} className="py-2 small mb-0">
                {mensajeGoogle.texto}
              </Alert>
            )}

            {vinculandoGoogle ? (
              <Spinner animation="border" variant="info" size="sm" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            ) : usuario.googleId ? (
              <>
                <div className="small text-body-secondary">
                  <i className="bi bi-check-circle-fill text-success me-1" aria-hidden="true" />
                  Cuenta de Google vinculada.
                </div>
                <Button variant="outline-danger" size="sm" className="align-self-start" onClick={handleDesvincularGoogle}>
                  Desvincular
                </Button>
              </>
            ) : (
              <>
                <div className="login-hint small">
                  <i className="bi bi-google me-1" aria-hidden="true" />
                  Vinculá tu cuenta de Google — más adelante habilita sincronizar Drive.
                </div>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setMensajeGoogle({ tipo: "danger", texto: "No se pudo iniciar la conexión con Google." })}
                />
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
