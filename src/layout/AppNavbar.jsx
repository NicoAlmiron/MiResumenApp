import { useState } from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMaterias } from "../context/MateriasContext";
import ColaEnvioModal from "../features/materias/ColaEnvioModal";

// Navbar principal: logo "MiResumen" + pestañas Resúmenes / Ventas + el botón
// de la cola de envío (con la cantidad de resúmenes "preparados" pendientes).
// El estilo de "pestaña" (píldora azul cuando está activa) se define en la
// clase .nav-tab de theme.scss / index.css.
export default function AppNavbar() {
  const { colaEnvio } = useMaterias();
  const [showCola, setShowCola] = useState(false);

  return (
    <>
      <Navbar expand="md" className="app-navbar py-3">
        <Container>
          <Navbar.Brand as={NavLink} to="/resumenes" className="fw-bold fs-4 text-info-emphasis">
            MiResumen
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-md-center gap-2">
              <Nav.Link as={NavLink} to="/resumenes" className="nav-tab">
                Resúmenes
              </Nav.Link>
              <Nav.Link as={NavLink} to="/ventas" className="nav-tab">
                Ventas
              </Nav.Link>
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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <ColaEnvioModal show={showCola} onHide={() => setShowCola(false)} />
    </>
  );
}
