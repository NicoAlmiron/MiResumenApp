import { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PDFDocument } from "pdf-lib";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import ListaArchivosOrdenable from "../../features/herramientas/ListaArchivosOrdenable";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

// Une varios PDF en uno solo, en el orden que se muestran en la lista.
// Conversión real y sin pérdida (copia las páginas tal cual con pdf-lib) —
// a diferencia de PDF↔Word, acá no hace falta ningún "mejor esfuerzo".
export default function UnirPdfsPage() {
  const [archivos, setArchivos] = useState([]);
  const [nombreSalida, setNombreSalida] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function handleArchivos(fileList) {
    setError("");
    const nuevos = [];
    for (const file of Array.from(fileList)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) continue;
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer());
        const paginas = doc.getPageCount();
        nuevos.push({
          id: crypto.randomUUID(),
          nombre: file.name,
          file,
          detalle: `${paginas} ${paginas === 1 ? "página" : "páginas"}`,
        });
      } catch {
        setError(`No se pudo leer "${file.name}" — ¿es un PDF válido?`);
      }
    }
    setArchivos((prev) => [...prev, ...nuevos]);
  }

  function eliminarArchivo(id) {
    setArchivos((prev) => prev.filter((a) => a.id !== id));
  }

  async function unirYDescargar() {
    setProcesando(true);
    setError("");
    try {
      const salida = await PDFDocument.create();
      for (const item of archivos) {
        const origen = await PDFDocument.load(await item.file.arrayBuffer());
        const paginasCopiadas = await salida.copyPages(origen, origen.getPageIndices());
        paginasCopiadas.forEach((pagina) => salida.addPage(pagina));
      }
      const bytesFinal = await salida.save();
      const nombre = conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf");
      descargarArchivo(bytesFinal, nombre, "application/pdf");
    } catch {
      setError("Algo falló al unir los PDF. Probá de nuevo.");
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
        <i className="bi bi-files me-2 text-info" aria-hidden="true" />
        Unir PDFs
      </h4>
      <p className="text-body-secondary mb-4">
        Subí varios PDF, ordenalos arrastrándolos, y descargá el resultado combinado.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      <ZonaCarga
        accept="application/pdf"
        multiple
        onArchivos={handleArchivos}
        texto="Agregar PDFs"
        ayuda="También podés arrastrarlos acá"
      />

      <div className="mt-3">
        <ListaArchivosOrdenable items={archivos} onReordenar={setArchivos} onEliminar={eliminarArchivo} />
      </div>

      <Form.Group className="mt-4">
        <Form.Label>Nombre del archivo final</Form.Label>
        <Form.Control
          value={nombreSalida}
          onChange={(e) => setNombreSalida(e.target.value)}
          placeholder={nombrePorDefecto("pdf")}
        />
      </Form.Group>

      <Button
        variant="success"
        className="fw-semibold mt-3"
        disabled={archivos.length < 2 || procesando}
        onClick={unirYDescargar}
      >
        <i className="bi bi-download me-1" aria-hidden="true" />
        {procesando ? "Uniendo..." : "Unir y descargar"}
      </Button>
      {archivos.length === 1 && (
        <p className="text-body-secondary small mt-2 mb-0">Agregá al menos un PDF más para poder unirlos.</p>
      )}
    </Container>
  );
}
