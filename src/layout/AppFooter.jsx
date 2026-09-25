import { Container, Dropdown } from "react-bootstrap";

// Accesos directos de ayuda/documentación general.
const ENLACES_DIRECTOS = [
  { nombre: "Campus", url: "https://campus4.unt.edu.ar/", icono: "bi-mortarboard-fill", descripcion: "Campus virtual UNT" },
  {
    nombre: "Asistiendo",
    url: "https://www.asistiendo.com.ar/",
    icono: "bi-journal-richtext",
    descripcion: "Guías y material de estudio",
  },
];

// Carpetas de Drive de cada agrupación estudiantil, con resúmenes compartidos.
// Si aparece una agrupación nueva, alcanza con sumar una entrada acá.
const AGRUPACIONES = [
  {
    nombre: "Drive Franja",
    url: "https://drive.google.com/drive/u/0/folders/1gD-APiODv82KVo6bJIBt0dKKKrxlwB5B",
  },
  {
    nombre: "Movimiento Humanista · 1er semestre",
    url: "https://drive.google.com/file/d/1-5jnI5RAzVeoCr7j04P3ehvaIrqGbJ3c",
  },
  {
    nombre: "Movimiento Humanista · 2do semestre",
    url: "https://drive.google.com/file/d/1LFSnfGj9ruMh430hNC32Tt9YLPGFCX26",
  },
  {
    nombre: "Nuevo Derecho",
    url: "https://drive.google.com/drive/folders/1-9zlivaKTjTgXbBQUBaldb2SZ0iRnZBa",
  },
  {
    nombre: "LyC - Libertad y Cambio",
    url: "https://drive.google.com/drive/folders/1PAEVNFypNLvXtHmtaPK-PTdIbSBFwDZA",
  },
];

export default function AppFooter() {
  return (
    <footer className="app-footer py-3 mt-4">
      <Container className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <span className="text-body-secondary small d-flex align-items-center gap-2">
          <i className="bi bi-question-circle" aria-hidden="true" />
          ¿Necesitás material o documentación? Accedé a estos recursos:
        </span>

        <div className="d-flex flex-wrap gap-2">
          {ENLACES_DIRECTOS.map((enlace) => (
            <a
              key={enlace.nombre}
              href={enlace.url}
              target="_blank"
              rel="noopener noreferrer"
              title={enlace.descripcion}
              className="btn btn-sm btn-outline-info rounded-pill footer-enlace"
            >
              <i className={`bi ${enlace.icono} me-1`} aria-hidden="true" />
              {enlace.nombre}
              <i className="bi bi-box-arrow-up-right ms-1 footer-enlace__externo" aria-hidden="true" />
            </a>
          ))}

          <Dropdown align="end">
            <Dropdown.Toggle
              variant="outline-info"
              size="sm"
              className="rounded-pill footer-enlace"
              id="dropdown-agrupaciones"
            >
              <i className="bi bi-folder2-open me-1" aria-hidden="true" />
              Apuntes por agrupación
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {AGRUPACIONES.map((agrupacion) => (
                <Dropdown.Item key={agrupacion.nombre} href={agrupacion.url} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-file-earmark-text me-2" aria-hidden="true" />
                  {agrupacion.nombre}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </footer>
  );
}
