import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Card, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { useMaterias } from "../context/MateriasContext";
import { descargarArchivoDelTablero } from "../api/tableros";
import { iconoPorExtension } from "../utils/iconoArchivo";
import { labelAnio } from "../utils/anioCursada";

// Solo lectura: entra un administrador a ver las Materias de UN boss
// puntual (nombres, veces compartido, qué resúmenes hay) — sin crear,
// editar, borrar, subir ni mover nada. La descarga sí funciona (mirar el
// contenido no es "gestionar").
export default function AdminSupervisarPage() {
  const { usuarioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cargarMateriasDeBoss } = useMaterias();

  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(false);
    cargarMateriasDeBoss(Number(usuarioId))
      .then((datos) => {
        if (!cancelado) setMaterias(datos);
      })
      .catch(() => {
        if (!cancelado) setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [usuarioId, cargarMateriasDeBoss]);

  const nombreBoss = location.state?.nombreUsuario ?? `usuario #${usuarioId}`;

  return (
    <Container className="py-4">
      <Button variant="link" className="p-0 mb-2 text-decoration-none" onClick={() => navigate("/resumenes")}>
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Resúmenes
      </Button>
      <h4 className="mb-1">
        <i className="bi bi-person-circle me-2 text-info" aria-hidden="true" />
        Materias de {nombreBoss}
      </h4>
      <p className="text-body-secondary mb-4 small">Solo lectura — acá no se puede crear, editar ni borrar nada.</p>

      {cargando ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="info" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">No se pudo cargar la información de este usuario.</Alert>
      ) : materias.length === 0 ? (
        <p className="text-body-secondary text-center py-5">Todavía no tiene Materias cargadas.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {materias.map((materia) => (
            <MateriaSupervisada key={materia.id} materia={materia} />
          ))}
        </div>
      )}
    </Container>
  );
}

function MateriaSupervisada({ materia }) {
  return (
    <Card>
      <Card.Body className="d-flex flex-column gap-3">
        <div>
          <Card.Title className="mb-1">{materia.nombre}</Card.Title>
          <div className="text-body-secondary small">
            {materia.cuatrimestre ? `${materia.cuatrimestre} · ${labelAnio(materia.anio)}` : labelAnio(materia.anio)}
          </div>
        </div>

        {materia.catedras.length === 0 ? (
          <p className="text-body-secondary small mb-0">Sin cátedras cargadas.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {materia.catedras.map((catedra) => (
              <div key={catedra.id} className="border border-secondary-subtle rounded-3 p-3">
                {catedra.comisiones.length === 0 ? (
                  <HojaSupervisada nombre={catedra.nombre} subtitulo={catedra.profesor} hoja={catedra} />
                ) : (
                  <>
                    <div className="fw-semibold mb-2">{catedra.nombre}</div>
                    <div className="d-flex flex-column gap-2">
                      {catedra.comisiones.map((comision) => (
                        <div key={comision.id} className="ps-3 border-start border-secondary-subtle">
                          <HojaSupervisada nombre={comision.nombre} subtitulo={comision.turno} hoja={comision} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// Una "hoja" (Cátedra sin Comisiones, o una Comisión puntual): veces
// compartido + los resúmenes que tiene, agrupados igual que el Kanban real
// pero sin ninguna acción (ni drag&drop, ni subir/mover/eliminar).
function HojaSupervisada({ nombre, subtitulo, hoja }) {
  const archivos = [...hoja.tablero.documentos, ...hoja.tablero.enEdicion, ...hoja.tablero.listo];

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div>
          <span className="fw-semibold">{nombre}</span>
          {subtitulo && <span className="text-body-secondary small ms-2">{subtitulo}</span>}
        </div>
        <span className="text-body-secondary small d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-repeat" aria-hidden="true" />
          {hoja.vecesCompartido} {hoja.vecesCompartido === 1 ? "vez compartido" : "veces compartido"}
        </span>
      </div>

      {archivos.length === 0 ? (
        <p className="text-body-secondary small mb-0">Sin resúmenes todavía.</p>
      ) : (
        <div className="d-flex flex-column gap-1">
          {archivos.map((archivo) => (
            <ArchivoSupervisado key={archivo.id} archivo={archivo} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchivoSupervisado({ archivo }) {
  const [descargando, setDescargando] = useState(false);

  async function handleDescargar() {
    setDescargando(true);
    try {
      await descargarArchivoDelTablero(archivo.id, archivo.nombre);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="d-flex align-items-center gap-2 small">
      <span aria-hidden="true">{iconoPorExtension(archivo.extension)}</span>
      <span className="flex-grow-1 text-truncate">{archivo.nombre}</span>
      <Badge bg="secondary-subtle" text="secondary-emphasis">
        {archivo.fechaActualizado}
      </Badge>
      <button
        type="button"
        className="mini-badge-btn mini-badge-btn--descargar"
        title="Descargar"
        disabled={descargando}
        onClick={handleDescargar}
      >
        {descargando ? <Spinner animation="border" size="sm" /> : <i className="bi bi-download" aria-hidden="true" />}
      </button>
    </div>
  );
}
