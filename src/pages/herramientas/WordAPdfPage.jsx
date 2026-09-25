import { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import mammoth from "mammoth";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { nombrePorDefecto } from "../../utils/nombreArchivo";

// Arma una vista previa a partir del .docx (con mammoth: conserva títulos,
// párrafos, negritas, listas) y dispara el diálogo de impresión del
// navegador para "Guardar como PDF" — da un PDF con texto real y
// seleccionable, a cambio de un paso extra (el diálogo nativo) en vez de una
// descarga 100% automática. @media print (ver index.css) oculta todo lo
// demás de la app para que el PDF resultante salga limpio.
export default function WordAPdfPage() {
  const [archivo, setArchivo] = useState(null);
  const [html, setHtml] = useState("");
  const [nombreSalida, setNombreSalida] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleArchivos(fileList) {
    const file = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith(".docx"));
    if (!file) {
      setError("Elegí un archivo .docx.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const resultado = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      setArchivo(file);
      setHtml(resultado.value);
    } catch {
      setError("No se pudo leer este .docx. Probá con otro archivo.");
    } finally {
      setCargando(false);
    }
  }

  function quitarArchivo() {
    setArchivo(null);
    setHtml("");
  }

  function imprimir() {
    // Muchos navegadores usan document.title como nombre sugerido al
    // "Guardar como PDF" desde el diálogo de impresión — es la única forma
    // de acercarnos a "elegir un nombre" en este flujo (window.print() no
    // deja fijar un nombre de archivo directamente).
    const tituloOriginal = document.title;
    const base = (nombreSalida.trim() || nombrePorDefecto("pdf")).replace(/\.pdf$/i, "");
    document.title = base;

    function restaurar() {
      document.title = tituloOriginal;
      window.removeEventListener("afterprint", restaurar);
    }
    window.addEventListener("afterprint", restaurar);
    window.print();
  }

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <div className="no-imprimir">
        <Link to="/herramientas" className="d-inline-block mb-2 text-decoration-none">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Herramientas
        </Link>
        <h4 className="mb-1">
          <i className="bi bi-filetype-pdf me-2 text-info" aria-hidden="true" />
          Word a PDF
        </h4>

        <Alert variant="warning" className="d-flex align-items-start gap-2">
          <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" />
          <div>
            Se arma una vista previa a partir del .docx y se abre el diálogo de impresión de tu navegador — ahí
            elegí <strong>"Guardar como PDF"</strong> como destino.
          </div>
        </Alert>

        {!archivo && (
          <ZonaCarga
            accept=".docx"
            onArchivos={handleArchivos}
            texto={cargando ? "Leyendo..." : "Elegir Word (.docx)"}
            ayuda="También podés arrastrarlo acá"
          />
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
                onClick={quitarArchivo}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Nombre sugerido para el PDF</Form.Label>
              <Form.Control
                value={nombreSalida}
                onChange={(e) => setNombreSalida(e.target.value)}
                placeholder={nombrePorDefecto("pdf")}
              />
            </Form.Group>

            <Button variant="success" className="fw-semibold" onClick={imprimir}>
              <i className="bi bi-printer-fill me-1" aria-hidden="true" />
              Imprimir / Guardar como PDF
            </Button>
          </>
        )}
      </div>

      {archivo && <div className="vista-previa-hoja mt-4" dangerouslySetInnerHTML={{ __html: html }} />}
    </Container>
  );
}
