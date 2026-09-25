import { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// "Mejor esfuerzo": extrae el TEXTO de cada página del PDF (con pdfjs-dist) y
// arma un .docx con eso (con la librería `docx`). No conserva imágenes,
// tablas ni el diseño original — una conversión 1:1 de verdad no es algo que
// se pueda hacer bien desde el navegador. Se avisa esto en pantalla.
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
      const pdf = await pdfjsLib.getDocument({
        data: await archivo.arrayBuffer(),
        // Sin esto, pdfjs pierde texto en PDFs con fuentes estándar no
        // incrustadas (ej. Helvetica) — ver vite.config.js (viteStaticCopy).
        standardFontDataUrl: "/pdfjs-standard-fonts/",
      }).promise;
      const parrafos = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const pagina = await pdf.getPage(i);
        const contenido = await pagina.getTextContent();
        const texto = contenido.items.map((item) => item.str).join(" ");
        parrafos.push(
          new Paragraph({ children: [new TextRun(texto || "(página sin texto)")], pageBreakBefore: i > 1 })
        );
      }

      const doc = new Document({ sections: [{ children: parrafos }] });
      const blob = await Packer.toBlob(doc);
      const nombre = conExtension(nombreSalida || nombrePorDefecto("docx"), "docx");
      descargarArchivo(blob, nombre, MIME_DOCX);
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

      <Alert variant="warning" className="d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" />
        <div>
          Esta conversión solo extrae el <strong>texto</strong> del PDF — no conserva imágenes, tablas ni el diseño
          original.
        </div>
      </Alert>

      {!archivo && (
        <ZonaCarga
          accept="application/pdf"
          onArchivos={handleArchivos}
          texto="Elegir PDF"
          ayuda="También podés arrastrarlo acá"
        />
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
