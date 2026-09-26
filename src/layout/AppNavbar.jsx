import { useState } from "react";
import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMaterias } from "../context/MateriasContext";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../data/authMockData";
import Logo from "../components/Logo";
import ColaEnvioModal from "../features/materias/ColaEnvioModal";
import CrearUsuarioModal from "../features/usuarios/CrearUsuarioModal";

// Navbar principal: logo + "MiResumen" + pestañas (varían según el rol, van
// dentro del menú hamburguesa en mobile) + cola de envío y usuario, estos
// últimos DOS siempre visibles (no se esconden detrás del hamburguesa) pero
// pasan a solo-ícono en la pantalla más chica (ver .d-none.d-sm-inline acá
// abajo). El estilo de "pestaña" (píldora azul cuando está activa) se define
// en la clase .nav-tab de theme.scss / index.css.
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
          <Navbar.Brand as={NavLink} to={inicio} className="fw-bold fs-4 text-info-emphasis d-flex align-items-center gap-2">
            <Logo size={26} />
            <span className="d-none d-sm-inline">MiResumen</span>
          </Navbar.Brand>

          {/* Siempre visibles, incluso con el menú colapsado */}
          <div className="d-flex align-items-center gap-2 order-md-2 ms-auto ms-md-0">
            {!esUsuario && (
              <button
                type="button"
                className="btn btn-outline-info rounded-pill navbar-cola-btn"
                title="Resúmenes preparados para enviar"
                onClick={() => setShowCola(true)}
              >
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                <span className="d-none d-sm-inline ms-1">Seleccionados</span>
                {colaEnvio.length > 0 && <span className="navbar-cola-btn__badge">{colaEnvio.length}</span>}
              </button>
            )}

            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" size="sm" className="rounded-pill navbar-user-btn" id="dropdown-usuario">
                <i className="fa-solid fa-circle-user" aria-hidden="true" />
                <span className="d-none d-sm-inline ms-1">{usuario.nombreUsuario}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={NavLink} to="/configuracion">
                  <i className="fa-solid fa-gear me-2" aria-hidden="true" />
                  Configuración
                </Dropdown.Item>
                {puedeCrearUsuarios && (
                  <Dropdown.Item onClick={() => setShowCrearUsuario(true)}>
                    <i className="fa-solid fa-user-plus me-2" aria-hidden="true" />
                    Crear usuario nuevo
                  </Dropdown.Item>
                )}
                {esAdministrador && (
                  <Dropdown.Item as={NavLink} to="/admin">
                    <i className="fa-solid fa-user-shield me-2" aria-hidden="true" />
                    Administrador
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout}>
                  <i className="fa-solid fa-right-from-bracket me-2" aria-hidden="true" />
                  Cerrar sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Navbar.Toggle aria-controls="main-navbar" />
          </div>

          <Navbar.Collapse id="main-navbar" className="order-md-1">
            <Nav className="me-auto align-items-md-center gap-2 mt-3 mt-md-0">
              {!esUsuario && (
                <>
                  <Nav.Link as={NavLink} to="/resumenes" className="nav-tab">
                    <i className="fa-solid fa-book-open me-1" aria-hidden="true" />
                    Resúmenes
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/ventas" className="nav-tab">
                    <i className="fa-solid fa-cart-shopping me-1" aria-hidden="true" />
                    Ventas
                  </Nav.Link>
                </>
              )}
              <Nav.Link as={NavLink} to="/herramientas" className="nav-tab">
                <i className="fa-solid fa-screwdriver-wrench me-1" aria-hidden="true" />
                Herramientas
              </Nav.Link>
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
