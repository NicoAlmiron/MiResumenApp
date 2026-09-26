import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { estaAutenticado, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Ya logueado y entró a /login igual (por ejemplo, escribiendo la URL a
  // mano): lo mandamos derecho a donde iba, o a "/" (IndexRedirect decide
  // según el rol) por defecto.
  if (estaAutenticado) {
    const destino = location.state?.from?.pathname ?? "/";
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    const ok = await login(nombreUsuario.trim(), password);
    setEnviando(false);
    if (!ok) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    const destino = location.state?.from?.pathname ?? "/";
    navigate(destino, { replace: true });
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center px-3">
      <Card className="login-card">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="fw-bold fs-3 text-info-emphasis mb-1">MiResumen</h1>
            <p className="text-body-secondary small mb-0">Iniciá sesión para continuar</p>
          </div>

          {error && (
            <Alert variant="danger" className="py-2 small d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                autoFocus
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="fw-semibold mt-2" disabled={enviando}>
              <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </Form>

          <div className="login-hint mt-4 small">
            <i className="bi bi-info-circle me-1" aria-hidden="true" />
            Usuarios de prueba (uno por rol):
            <ul className="mb-0 mt-1 ps-3">
              <li>
                <code>admin</code> / <code>admin123</code> — Administrador
              </li>
              <li>
                <code>boss</code> / <code>boss123</code> — Boss
              </li>
              <li>
                <code>usuario</code> / <code>usuario123</code> — Usuario
              </li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
