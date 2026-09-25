import { useState } from "react";
import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMaterias } from "../context/MateriasContext";
import { useAuth } from "../context/AuthContext";
import { ROLES, ETIQUETA_ROL } from "../data/authMockData";
import ColaEnvioModal from "../features/materias/ColaEnvioModal";
import CrearUsuarioModal from "../features/usuarios/CrearUsuarioModal";

// Navbar principal: logo "MiResumen" + pestañas (varían según el rol) + el
// botón de la cola de envío + el menú del usuario (Configuración, Crear
// usuario, Administrador, Cerrar sesión — cada uno según corresponda al rol).
// El estilo de "pestaña" (píldora azul cuando está activa) se define en la
// clase .nav-tab de theme.scss / index.css.
export default function AppNavbar() {
  const { colaEnvio } = useMaterias();
  const { usuario, logout } = useAuth();
  const [showCola, setShowCola] = useState(false);
  const [showCrearUsuario, setShowCrearUsuario] = useState(false);

  const esUsuario = usuario.rol === ROLES.USUARIO;
  const esAdministrador = usuario.rol === ROLES.ADMINISTRADOR;
  const puedeCrearUsuarios = esAdministrador || usuario.rol === ROLES.BOSS;
  const inicio = esUsuario ? "/herramientas" : "/resumenes";

  return (
    <>
      <Navbar expand="md" className="app-navbar py-3">
        <Container>
          <Navbar.Brand as={NavLink} to={inicio} className="fw-bold fs-4 text-info-emphasis">
            MiResumen
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-md-center gap-2">
              {!esUsuario && (
                <>
                  <Nav.Link as={NavLink} to="/resumenes" className="nav-tab">
                    Resúmenes
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/ventas" className="nav-tab">
                    Ventas
                  </Nav.Link>
                </>
              )}
              <Nav.Link as={NavLink} to="/herramientas" className="nav-tab">
                Herramientas
              </Nav.Link>

              {!esUsuario && (
                <button
                  type="button"
                  className="btn btn-outline-info rounded-pill navbar-cola-btn ms-md-2"
                  title="Resúmenes preparados para enviar"
                  onClick={() => setShowCola(true)}
                >
                  <i className="bi bi-send-fill me-1" aria-hidden="true" />
                  Seleccionados
                  {colaEnvio.length > 0 && <span className="navbar-cola-btn__badge">{colaEnvio.length}</span>}
                </button>
              )}

              <Dropdown align="end" className="ms-md-2">
                <Dropdown.Toggle variant="outline-light" size="sm" className="rounded-pill" id="dropdown-usuario">
                  <i className="bi bi-person-circle me-1" aria-hidden="true" />
                  {usuario.nombreUsuario}
                  <span className="navbar-rol-badge ms-2">{ETIQUETA_ROL[usuario.rol]}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={NavLink} to="/configuracion">
                    <i className="bi bi-gear-fill me-2" aria-hidden="true" />
                    Configuración
                  </Dropdown.Item>
                  {puedeCrearUsuarios && (
                    <Dropdown.Item onClick={() => setShowCrearUsuario(true)}>
                      <i className="bi bi-person-plus-fill me-2" aria-hidden="true" />
                      Crear usuario nuevo
                    </Dropdown.Item>
                  )}
                  {esAdministrador && (
                    <Dropdown.Item as={NavLink} to="/admin">
                      <i className="bi bi-speedometer2 me-2" aria-hidden="true" />
                      Administrador
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                    Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {!esUsuario && <ColaEnvioModal show={showCola} onHide={() => setShowCola(false)} />}
      {puedeCrearUsuarios && (
        <CrearUsuarioModal show={showCrearUsuario} onHide={() => setShowCrearUsuario(false)} />
      )}
    </>
  );
}
