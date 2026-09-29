import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Alert, Button, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useMaterias, getHoja, refHojaKey } from "../context/MateriasContext";
import TableroKanban from "../features/tablero/TableroKanban";
import RegistrarContactoModal from "../features/ventas/RegistrarContactoModal";

export default function TableroPage() {
  const { materiaId, catedraId, comisionId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { materias, cargando, registrarPedido, colaEnvio, agregarAColaEnvio, quitarDeColaEnvio } = useMaterias();
  const [showContacto, setShowContacto] = useState(false);

  const refHoja = {
    materiaId: Number(materiaId),
    catedraId: Number(catedraId),
    comisionId: comisionId != null ? Number(comisionId) : null,
  };

  const materia = materias.find((m) => m.id === refHoja.materiaId);
  const hoja = getHoja(materias, refHoja);

  if (cargando) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="info" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (!usuario.googleConectado) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="d-flex align-items-start gap-2">
          <i className="bi bi-google mt-1" aria-hidden="true" />
          <div>Para usar el Kanban necesitás conectar tu cuenta de Google primero.</div>
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="outline-light" onClick={() => navigate("/resumenes")}>
            ← Volver a Resúmenes
          </Button>
          <Button as={Link} to="/configuracion" variant="info">
            Ir a Configuración
          </Button>
        </div>
      </Container>
    );
  }

  if (!materia || !hoja) {
    return (
      <Container className="py-5">
        <Alert variant="warning">No se encontró este tablero.</Alert>
        <Button variant="outline-light" onClick={() => navigate("/resumenes")}>
          ← Volver a Resúmenes
        </Button>
      </Container>
    );
  }

  const estaListo = hoja.tablero.listo.length > 0;
  const enCola = colaEnvio.some((r) => refHojaKey(r) === refHojaKey(refHoja));

  return (
    <Container fluid className="py-4 px-3 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <Button variant="link" className="p-0 mb-1 text-decoration-none" onClick={() => navigate("/resumenes")}>
            ← Resúmenes
          </Button>
          <h2 className="mb-0">
            {materia.nombre} <span className="text-body-secondary">·</span> {hoja.nombre}
          </h2>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            className={`btn-compartir-hero fw-semibold ${estaListo ? "btn-compartir-hero--activo" : ""}`}
            variant={estaListo ? "success" : "outline-secondary"}
            disabled={!estaListo}
            onClick={() => setShowContacto(true)}
          >
            <i className="bi bi-share-fill me-2" aria-hidden="true" />
            Compartir
          </Button>

          <Button
            variant={enCola ? "info" : "outline-info"}
            className="fw-semibold rounded-pill btn-seccion"
            disabled={!estaListo}
            onClick={() => (enCola ? quitarDeColaEnvio(refHoja) : agregarAColaEnvio(refHoja))}
          >
            <i className={`bi ${enCola ? "bi-check-circle-fill" : "bi-send-plus-fill"} me-2`} aria-hidden="true" />
            {enCola ? "En la lista" : "Preparar envío"}
          </Button>

          <span className="text-body-secondary small">
            {hoja.vecesCompartido} {hoja.vecesCompartido === 1 ? "vez compartido" : "veces compartido"}
          </span>
        </div>
      </div>

      <TableroKanban hoja={hoja} refHoja={refHoja} />

      <RegistrarContactoModal
        show={showContacto}
        onHide={() => setShowContacto(false)}
        archivos={hoja.tablero.listo}
        onConfirmar={(contacto) => registrarPedido([refHoja], contacto)}
      />
    </Container>
  );
}
