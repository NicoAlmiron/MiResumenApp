import { useState } from "react";
import { Container, Form, Button, Alert, ButtonGroup, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";
import { rangosPorCantidad, rangosPorTamano, rangoValido, nombreParte } from "../../utils/dividirPdf";

const MODOS = [
  { id: "cantidad", label: "Cantidad de partes" },
  { id: "tamano", label: "Páginas por archivo" },
  { id: "personalizado", label: "Rangos personalizados" },
];

// Parte un PDF en varios, 100% en el navegador con pdf-lib — mismo patrón
// que Unir PDFs (ver UnirPdfsPage.jsx), en la dirección inversa: en vez de
// copiar páginas de varios PDF a uno, copia rangos de páginas de un PDF a
// varios, y los entrega juntos en un .zip (jszip).
export default function DividirPdfPage() {
  const [archivo, setArchivo] = useState(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [modo, setModo] = useState("cantidad");
  const [cantidadPartes, setCantidadPartes] = useState("");
  const [paginasPorArchivo, setPaginasPorArchivo] = useState("");
  const [rangosPersonalizados, setRangosPersonalizados] = useState([{ id: crypto.randomUUID(), desde: "", hasta: "" }]);
  const [nombreSalida, setNombreSalida] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function handleArchivos(fileList) {
    const file = Array.from(fileList).find((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!file) {
      setError("Elegí un archivo .pdf.");
      return;
    }
    setError("");
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      setArchivo(file);
      setTotalPaginas(doc.getPageCount());
    } catch {
      setError(`No se pudo leer "${file.name}" — ¿es un PDF válido?`);
    }
  }

  function quitarArchivo() {
    setArchivo(null);
    setTotalPaginas(0);
  }

  function agregarRango() {
    setRangosPersonalizados((prev) => [...prev, { id: crypto.randomUUID(), desde: "", hasta: "" }]);
  }
  function actualizarRango(id, campo, valor) {
    setRangosPersonalizados((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  }
  function eliminarRango(id) {
    setRangosPersonalizados((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  // Los 3 modos convergen acá: una lista de {desde, hasta} válidos, sin
  // importar de qué modo salieron — ver utils/dividirPdf.js.
  let rangos = [];
  if (modo === "cantidad") {
    const n = Number(cantidadPartes);
    if (Number.isInteger(n) && n >= 1 && n <= totalPaginas) rangos = rangosPorCantidad(totalPaginas, n);
  } else if (modo === "tamano") {
    const p = Number(paginasPorArchivo);
    if (Number.isInteger(p) && p >= 1 && p <= totalPaginas) rangos = rangosPorTamano(totalPaginas, p);
  } else {
    rangos = rangosPersonalizados
      .map((r) => ({ desde: Number(r.desde), hasta: Number(r.hasta) }))
      .filter((r) => rangoValido(r, totalPaginas));
  }

  async function dividirYDescargar() {
    if (!archivo || rangos.length === 0) return;
    setProcesando(true);
    setError("");
    try {
      const origen = await PDFDocument.load(await archivo.arrayBuffer());
      const zip = new JSZip();
      const prefijo = archivo.name.replace(/\.pdf$/i, "");
      for (const rango of rangos) {
        const indices = [];
        for (let p = rango.desde; p <= rango.hasta; p++) indices.push(p - 1);
        const nuevo = await PDFDocument.create();
        const paginas = await nuevo.copyPages(origen, indices);
        paginas.forEach((pagina) => nuevo.addPage(pagina));
        zip.file(nombreParte(prefijo, rango), await nuevo.save());
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const nombre = conExtension(nombreSalida || nombrePorDefecto("zip"), "zip");
      descargarArchivo(zipBlob, nombre, "application/zip");
    } catch {
      setError("Algo falló al dividir el PDF. Probá de nuevo.");
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
        <i className="bi bi-scissors me-2 text-info" aria-hidden="true" />
        Dividir PDF
      </h4>
      <p className="text-body-secondary mb-4">Partí un PDF largo en varios archivos más chicos, como quieras.</p>

      {error && <Alert variant="danger">{error}</Alert>}

      {!archivo && (
        <ZonaCarga accept=".pdf" onArchivos={handleArchivos} texto="Elegir PDF" ayuda="También podés arrastrarlo acá" />
      )}

      {archivo && (
        <>
          <div className="lista-ordenable__item mb-3">
            <i className="bi bi-filetype-pdf text-danger fs-5" aria-hidden="true" />
            <div className="flex-grow-1 text-truncate">
              {archivo.name} <span className="text-body-secondary small">· {totalPaginas} páginas</span>
            </div>
            <button type="button" className="mini-badge-btn mini-badge-btn--eliminar" title="Quitar" onClick={quitarArchivo}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <ButtonGroup className="mb-3">
            {MODOS.map((m) => (
              <Button key={m.id} variant={modo === m.id ? "info" : "outline-info"} onClick={() => setModo(m.id)}>
                {m.label}
              </Button>
            ))}
          </ButtonGroup>

          {modo === "cantidad" && (
            <Form.Group className="mb-3">
              <Form.Label>¿En cuántas partes?</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={totalPaginas}
                value={cantidadPartes}
                onChange={(e) => setCantidadPartes(e.target.value)}
                placeholder="Ej: 3"
              />
            </Form.Group>
          )}

          {modo === "tamano" && (
            <Form.Group className="mb-3">
              <Form.Label>¿Cuántas páginas por archivo?</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={totalPaginas}
                value={paginasPorArchivo}
                onChange={(e) => setPaginasPorArchivo(e.target.value)}
                placeholder="Ej: 20"
              />
            </Form.Group>
          )}

          {modo === "personalizado" && (
            <div className="mb-3 d-flex flex-column gap-2">
              {rangosPersonalizados.map((r) => (
                <Row key={r.id} className="g-2 align-items-center">
                  <Col xs={5}>
                    <Form.Control
                      type="number"
                      min="1"
                      max={totalPaginas}
                      value={r.desde}
                      onChange={(e) => actualizarRango(r.id, "desde", e.target.value)}
                      placeholder="Desde"
                    />
                  </Col>
                  <Col xs={5}>
                    <Form.Control
                      type="number"
                      min="1"
                      max={totalPaginas}
                      value={r.hasta}
                      onChange={(e) => actualizarRango(r.id, "hasta", e.target.value)}
                      placeholder="Hasta"
                    />
                  </Col>
                  <Col xs={2}>
                    <button
                      type="button"
                      className="mini-badge-btn mini-badge-btn--eliminar"
                      title="Quitar rango"
                      disabled={rangosPersonalizados.length === 1}
                      onClick={() => eliminarRango(r.id)}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-info" size="sm" className="align-self-start" onClick={agregarRango}>
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Agregar rango
              </Button>
            </div>
          )}

          {rangos.length > 0 && (
            <div className="mb-3">
              <p className="text-body-secondary small mb-1">
                Se {rangos.length === 1 ? "va" : "van"} a crear {rangos.length} archivo{rangos.length === 1 ? "" : "s"}:
              </p>
              <ul className="small mb-0">
                {rangos.map((r, i) => (
                  <li key={i}>
                    Parte {i + 1}: páginas {r.desde}
                    {r.desde !== r.hasta ? `-${r.hasta}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nombre del .zip final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto("zip")}
            />
          </Form.Group>

          <Button
            variant="success"
            className="fw-semibold"
            disabled={rangos.length === 0 || procesando}
            onClick={dividirYDescargar}
          >
            <i className="bi bi-download me-1" aria-hidden="true" />
            {procesando ? "Dividiendo..." : "Dividir y descargar"}
          </Button>
        </>
      )}
    </Container>
  );
}
