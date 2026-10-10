import { useEffect, useRef, useState } from "react";
import { Container, Form, Button, Alert, Card, ProgressBar, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import ListaArchivosOrdenable from "../../features/herramientas/ListaArchivosOrdenable";
import {
  crearUnion,
  subirArchivoAUnion,
  iniciarUnion,
  cancelarArchivoDeUnion,
  cancelarUnion,
  consultarTrabajo,
  descargarTrabajo,
} from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { reducirImagen } from "../../utils/vistaPrevia";
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
};
const ICONO_IMAGEN = "bi-file-earmark-image-fill text-info";
// Formatos de imagen que el servidor inserta tal cual; el resto (WebP, HEIC,
// AVIF…) solo sirve si el navegador logra convertirlo a JPEG antes de subir.
const IMAGENES_DEL_SERVIDOR = ["jpg", "jpeg", "jfif", "png", "bmp", "gif", "tif", "tiff"];
const EXTENSIONES_IMAGEN = [...IMAGENES_DEL_SERVIDOR, "webp", "heic", "heif", "avif"];
// Además de las extensiones van los tipos MIME: los selectores de archivos
// del celular filtran mal por extensión y dejaban PowerPoint e imágenes sin
// poder elegirse.
const ACCEPT = [
  ...Object.keys(ICONO_POR_EXTENSION).map((e) => `.${e}`),
  ...EXTENSIONES_IMAGEN.map((e) => `.${e}`),
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/rtf",
  "text/plain",
].join(",");
const LADO_MAXIMO_IMAGEN = 2200;
const MB = 1024 * 1024;
const MAX_ARCHIVO = 100 * MB;
const MAX_TOTAL = 400 * MB;
const MAX_ARCHIVOS = 300;
const SUBIDAS_EN_PARALELO = 3;
const ESPERA_INICIAL_MS = 2000;
const ESPERA_MAXIMA_MS = 6000;
const TOPE_TOTAL_MS = 60 * 60 * 1000;

const extensionDe = (nombre) => nombre.split(".").pop().toLowerCase();
const esImagen = (file) => file.type.startsWith("image/") || EXTENSIONES_IMAGEN.includes(extensionDe(file.name));

// Las imágenes se convierten a JPEG en el navegador antes de subir: cubre los
// formatos que el servidor no lee y achica las fotos del celular (suben mucho
// más rápido). Si el navegador no puede leerla, se sube tal cual cuando el
// servidor la entiende; si no, se devuelve null y ese archivo se omite.
async function prepararParaSubir(file) {
  if (!esImagen(file)) return file;
  try {
    const { blob } = await reducirImagen(file, LADO_MAXIMO_IMAGEN);
    return new File([blob], file.name.replace(/.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return IMAGENES_DEL_SERVIDOR.includes(extensionDe(file.name)) ? file : null;
  }
}
const formatearTamano = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const ESTADOS = {
  pendiente: { icono: "bi-circle", clase: "text-body-secondary", texto: "En espera" },
  subiendo: { spinner: true, clase: "text-info", texto: "Subiendo" },
  subido: { icono: "bi-cloud-check", clase: "text-body-secondary", texto: "Subido" },
  en_cola: { icono: "bi-hourglass-split", clase: "text-body-secondary", texto: "En cola" },
  convirtiendo: { spinner: true, clase: "text-info", texto: "Convirtiendo" },
  listo: { icono: "bi-check-circle-fill", clase: "text-success", texto: "Listo" },
  cancelado: { icono: "bi-slash-circle", clase: "text-body-secondary", texto: "Cancelado" },
  error: { icono: "bi-x-circle-fill", clase: "text-danger", texto: "No se pudo convertir" },
};

function EstadoArchivo({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.pendiente;
  return (
    <span className={`${e.clase} d-inline-flex align-items-center gap-1 flex-shrink-0 unir-estados__estado`} title={e.texto}>
      {e.spinner ? <Spinner animation="border" size="sm" /> : <i className={`bi ${e.icono}`} aria-hidden="true" />}
      <span>{e.texto}</span>
    </span>
  );
}

// Une PDF, Word, PowerPoint, Excel e imágenes en un solo PDF. Los archivos se
// suben de a 3 al microservicio de herramientas, que empieza a convertir cada
// uno apenas llega. Mientras tanto se puede cancelar cualquier archivo o todo
// el proceso. Si todos quedan listos se unen solos; si alguno falló o se
// canceló, la página se detiene en una revisión para decidir si unir el resto.
export default function UnirArchivosPage() {
  const [archivos, setArchivos] = useState([]);
  const [nombreSalida, setNombreSalida] = useState("");
  const [fase, setFase] = useState("inicio");
  // Estado de cada archivo: el de subida lo lleva esta página, el de
  // conversión lo informa el servidor (por posición en la lista).
  const [subida, setSubida] = useState([]);
  const [servidor, setServidor] = useState({});
  const [trabajoId, setTrabajoId] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const nombreRef = useRef("");
  const omitidosRef = useRef([]);
  const canceladosRef = useRef(new Set());
  const abortarRef = useRef(false);
  const uniendoRef = useRef(false);
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
    let activo = true; // deja de valer si el trabajo se cancela o cambia

    async function sondear() {
      try {
        const estado = await consultarTrabajo(trabajoId);
        if (desmontado.current || !activo) return;
        if (estado.estado === "listo") {
          setFase("descargando");
          const pdf = await descargarTrabajo(trabajoId);
          if (desmontado.current) return;
          descargarArchivo(pdf, conExtension(nombreRef.current || nombrePorDefecto("pdf"), "pdf"), "application/pdf");
          const noIncluidos = [...omitidosRef.current, ...(estado.fallidos ?? [])];
          if (noIncluidos.length) setAviso(`No se pudieron incluir: ${noIncluidos.join(", ")}`);
          setFase("listo");
          return;
        }
        if (estado.estado === "error") {
          setError(estado.detalle || "No se pudieron unir los archivos.");
          setFase("error");
          return;
        }
        setServidor(Object.fromEntries((estado.archivos ?? []).map((a) => [a.posicion, a.estado])));
        if (estado.estado !== "subiendo") setFase(estado.estado);
      } catch (err) {
        if (desmontado.current || !activo) return;
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
    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [trabajoId]);

  function handleArchivos(fileList) {
    setError("");
    const nuevos = [];
    const rechazados = [];
    for (const file of Array.from(fileList)) {
      const extension = extensionDe(file.name);
      const icono = esImagen(file) ? ICONO_IMAGEN : ICONO_POR_EXTENSION[extension];
      if (!icono) {
        rechazados.push(`${file.name} (formato no soportado)`);
      } else if (file.size > MAX_ARCHIVO) {
        rechazados.push(`${file.name} (supera 100 MB)`);
      } else {
        nuevos.push({
          id: crypto.randomUUID(),
          nombre: file.name,
          file,
          icono,
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
    setSubida(archivos.map(() => "pendiente"));
    setServidor({});
    canceladosRef.current = new Set();
    abortarRef.current = false;
    uniendoRef.current = false;
    const marcarSubida = (posicion, estado) =>
      !desmontado.current && setSubida((prev) => prev.map((e, i) => (i === posicion ? estado : e)));
    let id = null;
    try {
      ({ id } = await crearUnion(conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf")));
      // Se empieza a consultar ya: el servidor convierte cada archivo apenas llega.
      setTrabajoId(id);
      let siguiente = 0;
      const omitidos = [];
      omitidosRef.current = omitidos;
      // Tres "hilos" que van tomando el próximo archivo de la lista; cada uno
      // se sube con su posición, así el orden final no depende de cuál llega antes.
      async function hiloDeSubida() {
        while (siguiente < archivos.length && !abortarRef.current) {
          const posicion = siguiente++;
          const item = archivos[posicion];
          if (canceladosRef.current.has(posicion)) continue;
          marcarSubida(posicion, "subiendo");
          const listo = await prepararParaSubir(item.file);
          if (!listo) {
            omitidos.push(`${item.nombre} (el navegador no pudo leer esta imagen)`);
            marcarSubida(posicion, "error");
            continue;
          }
          try {
            await subirArchivoAUnion(id, listo, posicion);
          } catch (err) {
            if (err.status) {
              marcarSubida(posicion, "error");
              throw new Error(`${item.nombre}: ${err.message}`);
            }
            await subirArchivoAUnion(id, listo, posicion); // reintento si fue un corte de red
          }
          if (abortarRef.current) return;
          if (canceladosRef.current.has(posicion)) {
            // Se canceló mientras subía: se lo saca también del servidor.
            await cancelarArchivoDeUnion(id, posicion).catch(() => {});
            continue;
          }
          marcarSubida(posicion, "subido");
        }
      }
      await Promise.all(Array.from({ length: Math.min(SUBIDAS_EN_PARALELO, archivos.length) }, hiloDeSubida));
    } catch (err) {
      if (desmontado.current || abortarRef.current) return;
      setTrabajoId(null);
      setError(
        err.status === 0
          ? "No se pudo conectar con el servicio de herramientas. Si estuvo inactivo tarda un minuto en despertar: probá de nuevo."
          : err.message || "No se pudieron subir los archivos."
      );
      setFase("error");
    }
  }

  // Saca un archivo de la unión (en cualquier momento antes de unir).
  function cancelarArchivo(posicion) {
    canceladosRef.current.add(posicion);
    setSubida((prev) => prev.map((e, i) => (i === posicion ? "cancelado" : e)));
    const yaEnServidor = servidor[posicion] !== undefined || subida[posicion] === "subido";
    if (trabajoId && yaEnServidor) cancelarArchivoDeUnion(trabajoId, posicion).catch(() => {});
  }

  // Corta todo: deja de subir, borra el trabajo en el servidor y vuelve a la
  // lista de archivos para poder corregirla y probar de nuevo.
  function cancelarTodo() {
    abortarRef.current = true;
    if (trabajoId) cancelarUnion(trabajoId).catch(() => {});
    setTrabajoId(null);
    setError("");
    setFase("inicio");
  }

  async function confirmarUnion() {
    if (uniendoRef.current || !trabajoId) return;
    uniendoRef.current = true;
    try {
      await iniciarUnion(trabajoId);
      if (!desmontado.current) setFase("convirtiendo");
    } catch (err) {
      uniendoRef.current = false;
      if (!desmontado.current) setError(err.message || "No se pudo iniciar la unión.");
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
  const total = archivos.length;
  const estadoDe = (i) => {
    if (subida[i] === "cancelado") return "cancelado";
    return servidor[i] === "pendiente" ? "en_cola" : servidor[i] ?? subida[i] ?? "pendiente";
  };
  const estados = archivos.map((_, i) => estadoDe(i));
  const terminados = estados.filter((e) => e === "listo" || e === "error" || e === "cancelado").length;
  const listos = estados.filter((e) => e === "listo").length;
  // Todos los archivos llegaron a un estado final y todavía no se pidió unir.
  const todoProcesado = fase === "subiendo" && total > 0 && terminados === total;
  const enRevision = todoProcesado && listos < total;
  const unirSolo = todoProcesado && listos === total;
  const subidos = subida.filter((e) => e === "subido").length;
  const finalizando = fase === "armando" || fase === "descargando";
  const porcentaje = finalizando ? 100 : total > 0 ? Math.round((terminados / total) * 100) : 0;
  const enCurso = archivos.filter((_, i) => estados[i] === "convirtiendo" || estados[i] === "subiendo");
  const textoActual = finalizando
    ? fase === "armando"
      ? "Uniendo todo en un solo PDF…"
      : "Descargando el PDF…"
    : enCurso.length
      ? enCurso.map((a) => `${estados[archivos.indexOf(a)] === "subiendo" ? "Subiendo" : "Convirtiendo"} ${a.nombre}`).join(" · ")
      : "Esperando turno…";

  // Si todo salió bien no hace falta revisar nada: se une directamente.
  useEffect(() => {
    if (unirSolo) confirmarUnion();
    // confirmarUnion se recrea en cada render; lo que dispara esto es unirSolo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unirSolo]);

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
        PDF, Word, PowerPoint, Excel e imágenes de cualquier formato: ordenalos y descargá todo en un solo PDF.
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
            <div className="d-flex justify-content-between small mb-1">
              <span className="fw-semibold">Progreso general</span>
              <span className="text-body-secondary">
                {terminados} de {total} procesados{!todoProcesado && subidos < total ? ` · subidos ${subidos} de ${total}` : ""}
              </span>
            </div>
            <ProgressBar now={porcentaje} label={`${porcentaje}%`} className="mb-3" />

            {enRevision ? (
              <Alert variant="warning" className="small py-2">
                {listos > 0
                  ? `Quedaron listos ${listos} de ${total} archivos. Revisá la lista: podés unir los que están listos o cancelar.`
                  : "No quedó ningún archivo listo para unir."}
              </Alert>
            ) : (
              <>
                <div className="small fw-semibold mb-1">Ahora</div>
                <div className="d-flex align-items-center gap-2 small mb-1 text-truncate">
                  <Spinner animation="border" size="sm" role="status" />
                  <span className="text-truncate">{textoActual}</span>
                </div>
                <ProgressBar now={100} striped animated variant="info" style={{ height: "0.4rem" }} className="mb-3" />
              </>
            )}

            <ul className="unir-estados list-unstyled small mb-0">
              {archivos.map((a, i) => (
                <li key={a.id} className="d-flex align-items-center gap-2">
                  <EstadoArchivo estado={estados[i]} />
                  <span className="text-truncate flex-grow-1">{a.nombre}</span>
                  {fase === "subiendo" && estados[i] !== "cancelado" && estados[i] !== "error" && (
                    <button
                      type="button"
                      className="mini-badge-btn mini-badge-btn--eliminar"
                      title="Quitar este archivo de la unión"
                      onClick={() => cancelarArchivo(i)}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {(fase === "subiendo" || fase === "convirtiendo") && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {enRevision && (
                  <Button variant="success" size="sm" className="fw-semibold" disabled={listos === 0} onClick={confirmarUnion}>
                    <i className="bi bi-download me-1" aria-hidden="true" />
                    Unir los {listos} listos
                  </Button>
                )}
                <Button variant="outline-danger" size="sm" onClick={cancelarTodo}>
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Cancelar todo
                </Button>
              </div>
            )}
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
