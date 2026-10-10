import { useEffect, useRef, useState } from "react";
import { Container, Form, Button, Alert, Card, ProgressBar, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import ListaArchivosOrdenable from "../../features/herramientas/ListaArchivosOrdenable";
import {
  crearUnion,
  subirArchivoAUnion,
  iniciarUnion,
  consultarTrabajo,
  descargarTrabajo,
} from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

const ICONO_POR_EXTENSION = {
  pdf: "bi-file-earmark-pdf-fill text-danger",
  doc: "bi-file-earmark-word-fill text-primary",
  docx: "bi-file-earmark-word-fill text-primary",
  odt: "bi-file-earmark-word-fill text-primary",
  rtf: "bi-file-earmark-word-fill text-primary",
  txt: "bi-file-earmark-text-fill text-body-secondary",
  ppt: "bi-file-earmark-ppt-fill text-warning",
  pptx: "bi-file-earmark-ppt-fill text-warning",
  pps: "bi-file-earmark-ppt-fill text-warning",
  ppsx: "bi-file-earmark-ppt-fill text-warning",
  odp: "bi-file-earmark-ppt-fill text-warning",
  xls: "bi-file-earmark-excel-fill text-success",
  xlsx: "bi-file-earmark-excel-fill text-success",
  ods: "bi-file-earmark-excel-fill text-success",
  jpg: "bi-file-earmark-image-fill text-info",
  jpeg: "bi-file-earmark-image-fill text-info",
  png: "bi-file-earmark-image-fill text-info",
};
const ACCEPT = Object.keys(ICONO_POR_EXTENSION)
  .map((e) => `.${e}`)
  .join(",");
const MB = 1024 * 1024;
const MAX_ARCHIVO = 100 * MB;
const MAX_TOTAL = 400 * MB;
const MAX_ARCHIVOS = 300;
const SUBIDAS_EN_PARALELO = 3;
const ESPERA_INICIAL_MS = 2000;
const ESPERA_MAXIMA_MS = 6000;
const TOPE_TOTAL_MS = 60 * 60 * 1000;

const extensionDe = (nombre) => nombre.split(".").pop().toLowerCase();
const formatearTamano = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Une PDF, Word, PowerPoint, Excel e imágenes en un solo PDF. Los archivos se
// suben de a 3 al microservicio de herramientas, que empieza a convertir cada
// uno apenas llega; al terminar de subir se inicia la unión en el orden de la
// lista y esta página consulta el avance hasta descargar el resultado.
export default function UnirArchivosPage() {
  const [archivos, setArchivos] = useState([]);
  const [nombreSalida, setNombreSalida] = useState("");
  const [fase, setFase] = useState("inicio");
  const [avance, setAvance] = useState({ listos: 0, total: 0 });
  const [trabajoId, setTrabajoId] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
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
          const pdf = await descargarTrabajo(trabajoId);
          if (desmontado.current) return;
          descargarArchivo(pdf, conExtension(nombreRef.current || nombrePorDefecto("pdf"), "pdf"), "application/pdf");
          if (estado.fallidos?.length) setAviso(`No se pudieron incluir: ${estado.fallidos.join(", ")}`);
          setFase("listo");
          return;
        }
        if (estado.estado === "error") {
          setError(estado.detalle || "No se pudieron unir los archivos.");
          setFase("error");
          return;
        }
        setAvance({ listos: estado.archivos_listos ?? 0, total: estado.total_archivos ?? 0 });
        setFase(estado.estado);
      } catch (err) {
        if (desmontado.current) return;
        if (err.status === 404) {
          setError("Se perdió el trabajo (el servicio se reinició). Probá de nuevo.");
          setFase("error");
          return;
        }
      }
      if (Date.now() - inicio > TOPE_TOTAL_MS) {
        setError("La unión tardó demasiado. Probá con menos archivos.");
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
    setError("");
    const nuevos = [];
    const rechazados = [];
    for (const file of Array.from(fileList)) {
      const extension = extensionDe(file.name);
      if (!ICONO_POR_EXTENSION[extension]) {
        rechazados.push(`${file.name} (formato no soportado)`);
      } else if (file.size > MAX_ARCHIVO) {
        rechazados.push(`${file.name} (supera 100 MB)`);
      } else {
        nuevos.push({
          id: crypto.randomUUID(),
          nombre: file.name,
          file,
          icono: ICONO_POR_EXTENSION[extension],
          detalle: formatearTamano(file.size),
        });
      }
    }
    const combinados = [...archivos, ...nuevos];
    if (combinados.length > MAX_ARCHIVOS) {
      rechazados.push(`hay más de ${MAX_ARCHIVOS} archivos, se quitaron los últimos`);
    }
    setArchivos(combinados.slice(0, MAX_ARCHIVOS));
    if (rechazados.length) setError(`No se agregaron: ${rechazados.join("; ")}`);
  }

  function eliminarArchivo(id) {
    setArchivos((prev) => prev.filter((a) => a.id !== id));
  }

  const tamanoTotal = archivos.reduce((suma, a) => suma + a.file.size, 0);

  async function unir() {
    if (archivos.length === 0) return;
    if (tamanoTotal > MAX_TOTAL) {
      setError("Entre todos los archivos se superan los 400 MB. Quitá algunos.");
      return;
    }
    nombreRef.current = nombreSalida;
    setError("");
    setAviso("");
    setFase("subiendo");
    setAvance({ listos: 0, total: archivos.length });
    try {
      const { id } = await crearUnion(conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf"));
      let siguiente = 0;
      let subidos = 0;
      // Tres "hilos" que van tomando el próximo archivo de la lista; cada uno
      // se sube con su posición, así el orden final no depende de cuál llega antes.
      async function hiloDeSubida() {
        while (siguiente < archivos.length) {
          const posicion = siguiente++;
          const item = archivos[posicion];
          try {
            await subirArchivoAUnion(id, item.file, posicion);
          } catch (err) {
            if (err.status) throw new Error(`${item.nombre}: ${err.message}`);
            await subirArchivoAUnion(id, item.file, posicion); // reintento si fue un corte de red
          }
          subidos += 1;
          if (!desmontado.current) setAvance({ listos: subidos, total: archivos.length });
        }
      }
      await Promise.all(Array.from({ length: Math.min(SUBIDAS_EN_PARALELO, archivos.length) }, hiloDeSubida));
      await iniciarUnion(id);
      if (desmontado.current) return;
      setFase("convirtiendo");
      setTrabajoId(id);
    } catch (err) {
      if (desmontado.current) return;
      setError(
        err.status === 0
          ? "No se pudo conectar con el servicio de herramientas. Si estuvo inactivo tarda un minuto en despertar: probá de nuevo."
          : err.message || "No se pudieron subir los archivos."
      );
      setFase("error");
    }
  }

  function reiniciar() {
    setArchivos([]);
    setTrabajoId(null);
    setError("");
    setAviso("");
    setFase("inicio");
  }

  const enProceso = ["subiendo", "convirtiendo", "armando", "descargando"].includes(fase);
  const porcentaje = avance.total > 0 ? Math.round((avance.listos / avance.total) * 100) : 0;
  const textoFase = {
    subiendo: `Subiendo archivos: ${avance.listos} de ${avance.total}`,
    convirtiendo: `Convirtiendo a PDF: ${avance.listos} de ${avance.total}`,
    armando: "Uniendo todo en un solo PDF…",
    descargando: "Descargando el PDF…",
  }[fase];

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <Link to="/herramientas" className="d-inline-block mb-2 text-decoration-none">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        Herramientas
      </Link>
      <h4 className="mb-1">
        <i className="bi bi-collection-fill me-2 text-info" aria-hidden="true" />
        Unir archivos en PDF
      </h4>
      <p className="text-body-secondary mb-4">
        PDF, Word, PowerPoint, Excel e imágenes: ordenalos y descargá todo en un solo PDF.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {!enProceso && fase !== "listo" && (
        <>
          <ZonaCarga
            accept={ACCEPT}
            multiple
            onArchivos={handleArchivos}
            texto="Agregar archivos"
            ayuda={`Hasta ${MAX_ARCHIVOS} archivos y 400 MB en total. También podés arrastrarlos acá.`}
          />

          <div className="mt-3">
            <ListaArchivosOrdenable items={archivos} onReordenar={setArchivos} onEliminar={eliminarArchivo} />
          </div>
          {archivos.length > 0 && (
            <p className="small text-body-secondary mt-2 mb-0">
              {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"} · {formatearTamano(tamanoTotal)}
            </p>
          )}

          <Form.Group className="mt-4">
            <Form.Label>Nombre del archivo final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto("pdf")}
            />
          </Form.Group>

          <Button variant="success" className="fw-semibold mt-3" disabled={archivos.length === 0} onClick={unir}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            Unir en PDF
          </Button>
        </>
      )}

      {enProceso && (
        <Card aria-live="polite">
          <Card.Body>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Spinner animation="border" size="sm" role="status" />
              <span>{textoFase}</span>
            </div>
            <ProgressBar
              now={fase === "armando" || fase === "descargando" ? 100 : porcentaje}
              label={fase === "subiendo" || fase === "convirtiendo" ? `${porcentaje}%` : ""}
              animated
            />
            <p className="small text-body-secondary mt-3 mb-0">
              Los Word, PowerPoint y Excel se convierten en el servidor: con muchos archivos puede tardar unos minutos.
            </p>
          </Card.Body>
        </Card>
      )}

      {fase === "listo" && (
        <>
          {aviso && <Alert variant="warning">{aviso}</Alert>}
          <Alert variant="success" className="d-flex justify-content-between align-items-center">
            <span>Listo: el PDF se descargó.</span>
            <Button variant="outline-success" size="sm" onClick={reiniciar}>
              Unir otros
            </Button>
          </Alert>
        </>
      )}
    </Container>
  );
}
