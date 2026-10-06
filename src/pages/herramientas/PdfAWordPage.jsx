import { useEffect, useRef, useState } from "react";
import { Container, Form, Button, Alert, Card, Placeholder, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { iniciarConversionPdfAWord, consultarTrabajo, descargarTrabajo } from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ESPERA_INICIAL_MS = 3000;
const ESPERA_MAXIMA_MS = 10000;
const TOPE_TOTAL_MS = 20 * 60 * 1000;

const TEXTO_POR_FASE = {
  subiendo: "Subiendo el PDF…",
  en_cola: "Esperando turno para convertir…",
  procesando: "Reconociendo el texto de las páginas. Puede tardar varios minutos según el tamaño del documento.",
  descargando: "Descargando el Word…",
};

// La conversión corre en segundo plano en el microservicio de herramientas: al
// subir el PDF se obtiene un trabajo y esta página consulta su estado hasta
// que el .docx está listo. Así no depende de que una sola petición dure
// minutos (el proxy de Render corta las que tardan más de ~100 s).
export default function PdfAWordPage() {
  const [archivo, setArchivo] = useState(null);
  const [nombreSalida, setNombreSalida] = useState("");
  const [fase, setFase] = useState("inicio");
  const [trabajoId, setTrabajoId] = useState(null);
  const [error, setError] = useState("");
  const nombreRef = useRef("");
  const desmontado = useRef(false);

  useEffect(() => {
    desmontado.current = false;
    return () => {
      desmontado.current = true;
    };
  }, []);

  useEffect(() => {
    if (!trabajoId) return undefined;
    const inicio = Date.now();
    let espera = ESPERA_INICIAL_MS;
    let timer = null;

    async function sondear() {
      try {
        const estado = await consultarTrabajo(trabajoId);
        if (desmontado.current) return;
        if (estado.estado === "listo") {
          setFase("descargando");
          const docx = await descargarTrabajo(trabajoId);
          if (desmontado.current) return;
          descargarArchivo(docx, conExtension(nombreRef.current || nombrePorDefecto("docx"), "docx"), MIME_DOCX);
          setFase("listo");
          return;
        }
        if (estado.estado === "error") {
          setError(estado.detalle || "No se pudo convertir este PDF. Probá con otro archivo.");
          setFase("error");
          return;
        }
        setFase(estado.estado);
      } catch (err) {
        if (desmontado.current) return;
        if (err.status === 404) {
          setError("Se perdió el trabajo (el servicio se reinició mientras convertía). Probá de nuevo.");
          setFase("error");
          return;
        }
        // Errores de red u otros: se reintenta, el servicio puede estar despertando.
      }
      if (Date.now() - inicio > TOPE_TOTAL_MS) {
        setError("La conversión tardó demasiado. Probá dividir el PDF en partes más chicas.");
        setFase("error");
        return;
      }
      espera = Math.min(espera * 1.3, ESPERA_MAXIMA_MS);
      timer = setTimeout(sondear, espera);
    }

    sondear();
    return () => clearTimeout(timer);
  }, [trabajoId]);

  function handleArchivos(fileList) {
    const file = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!file) {
      setError("Elegí un archivo .pdf.");
      return;
    }
    setError("");
    setArchivo(file);
  }

  async function convertir() {
    if (!archivo) return;
    nombreRef.current = nombreSalida;
    setError("");
    setFase("subiendo");
    try {
      const { id } = await iniciarConversionPdfAWord(archivo);
      setTrabajoId(id);
      setFase("en_cola");
    } catch (err) {
      setError(
        err.status === 0
          ? "No se pudo conectar con el servicio de herramientas. Si estuvo inactivo, tarda un minuto en despertar: probá de nuevo."
          : err.message || "No se pudo iniciar la conversión."
      );
      setFase("error");
    }
  }

  function reiniciar() {
    setArchivo(null);
    setTrabajoId(null);
    setError("");
    setFase("inicio");
  }

  const enProceso = ["subiendo", "en_cola", "procesando", "descargando"].includes(fase);

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <Link to="/herramientas" className="d-inline-block mb-2 text-decoration-none">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Herramientas
      </Link>
      <h4 className="mb-1">
        <i className="bi bi-filetype-docx me-2 text-info" aria-hidden="true" />
        PDF a Word
      </h4>
      <p className="text-body-secondary small">
        Conserva tablas y diseño. Si el PDF es una foto o un escaneo, también reconoce el texto de cada página.
      </p>

      {!archivo && (
        <ZonaCarga accept="application/pdf" onArchivos={handleArchivos} texto="Elegir PDF" ayuda="También podés arrastrarlo acá" />
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {archivo && !enProceso && fase !== "listo" && (
        <div className="lista-ordenable__item mt-3">
          <i className="bi bi-file-earmark-pdf-fill text-danger fs-5" aria-hidden="true" />
          <div className="flex-grow-1 text-truncate">{archivo.name}</div>
          <button type="button" className="mini-badge-btn mini-badge-btn--eliminar" title="Quitar" onClick={reiniciar}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      )}

      {enProceso && (
        <Card className="mt-3" aria-live="polite">
          <Card.Body>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Spinner animation="border" size="sm" role="status" />
              <span>{TEXTO_POR_FASE[fase]}</span>
            </div>
            <Placeholder as="div" animation="glow" className="mb-2">
              <Placeholder xs={12} />
              <Placeholder xs={10} />
              <Placeholder xs={11} />
              <Placeholder xs={7} />
            </Placeholder>
            <p className="small text-body-secondary mb-0 text-truncate">{archivo?.name}</p>
          </Card.Body>
        </Card>
      )}

      {fase === "listo" && (
        <Alert variant="success" className="mt-3 d-flex justify-content-between align-items-center">
          <span>Listo: el Word se descargó.</span>
          <Button variant="outline-success" size="sm" onClick={reiniciar}>
            Convertir otro
          </Button>
        </Alert>
      )}

      {!enProceso && fase !== "listo" && (
        <>
          <Form.Group className="mt-4">
            <Form.Label>Nombre del archivo final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto("docx")}
            />
          </Form.Group>

          <Button variant="success" className="fw-semibold mt-3" disabled={!archivo} onClick={convertir}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            Convertir y descargar
          </Button>
        </>
      )}
    </Container>
  );
}
