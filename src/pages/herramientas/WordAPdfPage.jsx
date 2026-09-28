import { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { convertirWordAPdf } from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

// Conversión real: el backend manda el .docx a Gotenberg (LibreOffice detrás
// de una API HTTP) y devuelve un PDF de verdad — conserva diseño, no es una
// vista previa + "Guardar como PDF" del navegador como antes.
export default function WordAPdfPage() {
  const [archivo, setArchivo] = useState(null);
  const [nombreSalida, setNombreSalida] = useState("");
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [error, setError] = useState("");

  function handleArchivos(fileList) {
    const file = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith(".docx"));
    if (!file) {
      setError("Elegí un archivo .docx.");
      return;
    }
    setError("");
    setArchivo(file);
  }

  async function convertirYDescargar() {
    if (!archivo) return;
    setConvirtiendo(true);
    setError("");
    try {
      const pdf = await convertirWordAPdf(archivo);
      const nombre = conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf");
      descargarArchivo(pdf, nombre, "application/pdf");
    } catch {
      setError("No se pudo convertir este archivo. Probá con otro .docx.");
    } finally {
      setConvirtiendo(false);
    }
  }

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <Link to="/herramientas" className="d-inline-block mb-2 text-decoration-none">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Herramientas
      </Link>
      <h4 className="mb-1">
        <i className="bi bi-filetype-pdf me-2 text-info" aria-hidden="true" />
        Word a PDF
      </h4>
      <p className="text-body-secondary small">Conversión real (LibreOffice) — conserva el diseño original.</p>

      {!archivo && (
        <ZonaCarga accept=".docx" onArchivos={handleArchivos} texto="Elegir Word (.docx)" ayuda="También podés arrastrarlo acá" />
      )}

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {archivo && (
        <>
          <div className="lista-ordenable__item mt-3 mb-3">
            <i className="bi bi-file-earmark-word-fill text-primary fs-5" aria-hidden="true" />
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

          <Form.Group className="mb-3">
            <Form.Label>Nombre del archivo final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto("pdf")}
            />
          </Form.Group>

          <Button variant="success" className="fw-semibold" disabled={convirtiendo} onClick={convertirYDescargar}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            {convirtiendo ? "Convirtiendo..." : "Convertir y descargar"}
          </Button>
        </>
      )}
    </Container>
  );
}
