import { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { convertirPdfAWord } from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Conversión real: el backend usa pdf2docx (conserva tablas y el layout
// bastante mejor que solo extraer texto, que era lo que hacía la versión
// vieja 100% en el navegador).
export default function PdfAWordPage() {
  const [archivo, setArchivo] = useState(null);
  const [nombreSalida, setNombreSalida] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  function handleArchivos(fileList) {
    const file = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!file) {
      setError("Elegí un archivo .pdf.");
      return;
    }
    setError("");
    setArchivo(file);
  }

  async function convertirYDescargar() {
    if (!archivo) return;
    setProcesando(true);
    setError("");
    try {
      const docx = await convertirPdfAWord(archivo);
      const nombre = conExtension(nombreSalida || nombrePorDefecto("docx"), "docx");
      descargarArchivo(docx, nombre, MIME_DOCX);
    } catch {
      setError("No se pudo convertir este PDF. Probá con otro archivo.");
    } finally {
      setProcesando(false);
    }
  }

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
      <p className="text-body-secondary small">Conversión real (pdf2docx) — conserva tablas y el diseño bastante mejor que solo texto.</p>

      {!archivo && (
        <ZonaCarga accept="application/pdf" onArchivos={handleArchivos} texto="Elegir PDF" ayuda="También podés arrastrarlo acá" />
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {archivo && (
        <div className="lista-ordenable__item mt-3">
          <i className="bi bi-file-earmark-pdf-fill text-danger fs-5" aria-hidden="true" />
          <div className="flex-grow-1 text-truncate">{archivo.name}</div>
          <button
            type="button"
            className="mini-badge-btn mini-badge-btn--eliminar"
            title="Quitar"
            onClick={() => setArchivo(null)}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      )}

      <Form.Group className="mt-4">
        <Form.Label>Nombre del archivo final</Form.Label>
        <Form.Control
          value={nombreSalida}
          onChange={(e) => setNombreSalida(e.target.value)}
          placeholder={nombrePorDefecto("docx")}
        />
      </Form.Group>

      <Button
        variant="success"
        className="fw-semibold mt-3"
        disabled={!archivo || procesando}
        onClick={convertirYDescargar}
      >
        <i className="bi bi-download me-1" aria-hidden="true" />
        {procesando ? "Convirtiendo..." : "Convertir y descargar"}
      </Button>
    </Container>
  );
}
