import { useState, useRef, useEffect, useCallback } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import ListaImagenesOrdenable from "../../features/herramientas/ListaImagenesOrdenable";
import { construirPdfDeImagenes } from "../../utils/imagenesAPdf";
import { recortarImagenEnBackend } from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

// Arma un PDF de varias páginas a partir de varias imágenes/fotos — todo el
// armado pasa por el navegador (pdf-lib + Canvas, mismo patrón que
// UnirPdfsPage/DividirPdfPage). El recorte/enderezado y el filtro blanco y
// negro son por foto (ver ListaImagenesOrdenable): "Auto-recorte" y "Blanco
// y negro" de acá arriba solo fijan el valor por defecto de las fotos que
// se agreguen de ahora en más, cada una se puede ajustar después con el
// lapicito de su fila.
export default function ImagenesAPdfPage() {
  const [imagenes, setImagenes] = useState([]);
  const [autoRecorte, setAutoRecorte] = useState(true);
  const [filtroDocumento, setFiltroDocumento] = useState(false);
  const [nombreSalida, setNombreSalida] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const inputCamaraRef = useRef(null);

  // Los object URL de las miniaturas viven solo en memoria del navegador —
  // hay que liberarlos a mano (quitar una imagen, alternar el recorte, o al
  // desmontar la página). Via ref para que el cleanup del unmount vea la
  // lista actual, no la del primer render (closure del efecto de cleanup,
  // que solo corre una vez).
  const imagenesRef = useRef(imagenes);
  useEffect(() => {
    imagenesRef.current = imagenes;
  }, [imagenes]);
  useEffect(() => {
    return () => imagenesRef.current.forEach((item) => URL.revokeObjectURL(item.miniatura));
  }, []);

  // Pide el recorte al backend (OpenCV real, ver app/services/imagen_service.py)
  // para UNA foto puntual y actualiza ese item — la usan tanto el alta
  // automática (si autoRecorte está activo) como el lapicito cuando el
  // usuario prende el recorte de una foto que todavía no se había intentado
  // recortar.
  const recortarItem = useCallback(async (id, archivoOriginal, nombre) => {
    setImagenes((prev) => prev.map((i) => (i.id === id ? { ...i, procesando: true } : i)));
    let recortada = null;
    try {
      const resultado = await recortarImagenEnBackend(archivoOriginal);
      if (resultado.recorteAplicado) {
        recortada = new File([resultado.blob], nombre, { type: "image/jpeg" });
      }
    } catch (err) {
      console.error("Auto-recorte falló para", nombre, err);
    }
    setImagenes((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (!recortada) return { ...i, procesando: false };
        URL.revokeObjectURL(i.miniatura);
        return {
          ...i,
          archivoRecortado: recortada,
          recorteAplicado: true,
          file: recortada,
          miniatura: URL.createObjectURL(recortada),
          procesando: false,
        };
      })
    );
  }, []);

  const handleArchivos = useCallback(
    async (fileList) => {
      setError("");
      const nuevas = Array.from(fileList)
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          nombre: file.name,
          file,
          archivoOriginal: file,
          archivoRecortado: null,
          recorteAplicado: false,
          filtro: filtroDocumento,
          miniatura: URL.createObjectURL(file),
          procesando: autoRecorte,
        }));
      if (nuevas.length === 0) {
        setError("Elegí una imagen (foto o captura).");
        return;
      }
      setImagenes((prev) => [...prev, ...nuevas]);
      if (!autoRecorte) return;

      // Una a la vez (no en paralelo) para que la lista vaya mostrando el
      // resultado foto por foto, como un escáner real.
      for (const item of nuevas) {
        await recortarItem(item.id, item.archivoOriginal, item.nombre);
      }
    },
    [autoRecorte, filtroDocumento, recortarItem]
  );

  function handleCamara(e) {
    if (e.target.files?.length) handleArchivos(e.target.files);
    e.target.value = "";
  }

  function eliminarImagen(id) {
    setImagenes((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.miniatura);
      return prev.filter((i) => i.id !== id);
    });
  }

  // Prende/apaga el recorte de una foto puntual. Si ya hay una versión
  // recortada en caché (archivoRecortado), solo cambia cuál de las dos se
  // usa — si todavía no se había intentado (autoRecorte estaba apagado al
  // subirla), recién ahí pide el recorte al backend.
  function alternarRecorte(item) {
    if (item.recorteAplicado) {
      setImagenes((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          URL.revokeObjectURL(i.miniatura);
          return { ...i, recorteAplicado: false, file: i.archivoOriginal, miniatura: URL.createObjectURL(i.archivoOriginal) };
        })
      );
    } else if (item.archivoRecortado) {
      setImagenes((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          URL.revokeObjectURL(i.miniatura);
          return { ...i, recorteAplicado: true, file: i.archivoRecortado, miniatura: URL.createObjectURL(i.archivoRecortado) };
        })
      );
    } else {
      recortarItem(item.id, item.archivoOriginal, item.nombre);
    }
  }

  function alternarFiltro(id) {
    setImagenes((prev) => prev.map((i) => (i.id === id ? { ...i, filtro: !i.filtro } : i)));
  }

  async function convertirYDescargar() {
    if (imagenes.length === 0) return;
    setProcesando(true);
    setError("");
    try {
      const pdfBytes = await construirPdfDeImagenes(imagenes);
      const nombre = conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf");
      descargarArchivo(pdfBytes, nombre, "application/pdf");
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      const detalle = err instanceof Error ? err.stack || err.message : String(err);
      setError(`Algo falló al generar el archivo:\n${detalle}`);
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
        <i className="bi bi-camera-fill me-2 text-info" aria-hidden="true" />
        Imágenes a PDF
      </h4>
      <p className="text-body-secondary mb-4">Sacá fotos o subí imágenes y armá un PDF de varias páginas.</p>

      {error && (
        <Alert variant="danger" style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
          {error}
        </Alert>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <ZonaCarga
          accept="image/*"
          multiple
          onArchivos={handleArchivos}
          texto="Elegir imágenes"
          ayuda="También podés arrastrarlas acá"
        />
        <Button variant="outline-info" size="sm" className="align-self-start" onClick={() => inputCamaraRef.current?.click()}>
          <i className="bi bi-camera-fill me-1" aria-hidden="true" />
          Tomar foto
        </Button>
        <input ref={inputCamaraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleCamara} />
      </div>

      <div className="d-flex gap-2 mb-3">
        <button
          type="button"
          className={`opcion-toggle ${autoRecorte ? "opcion-toggle--activo" : ""}`}
          onClick={() => setAutoRecorte((v) => !v)}
        >
          <i className="bi bi-crop opcion-toggle__icono" aria-hidden="true" />
          <span>Auto-recorte</span>
          <i className={`bi ${autoRecorte ? "bi-check-circle-fill" : "bi-circle"} opcion-toggle__check`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`opcion-toggle ${filtroDocumento ? "opcion-toggle--activo" : ""}`}
          onClick={() => setFiltroDocumento((v) => !v)}
        >
          <i className="bi bi-contrast opcion-toggle__icono" aria-hidden="true" />
          <span>Blanco y negro</span>
          <i
            className={`bi ${filtroDocumento ? "bi-check-circle-fill" : "bi-circle"} opcion-toggle__check`}
            aria-hidden="true"
          />
        </button>
      </div>

      <ListaImagenesOrdenable
        items={imagenes}
        onReordenar={setImagenes}
        onEliminar={eliminarImagen}
        onAlternarRecorte={alternarRecorte}
        onAlternarFiltro={alternarFiltro}
      />

      {imagenes.length > 0 && (
        <>
          <Form.Group className="mt-3">
            <Form.Label>Nombre del archivo final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto("pdf")}
            />
          </Form.Group>

          <Button variant="success" className="fw-semibold mt-3" disabled={procesando} onClick={convertirYDescargar}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            {procesando ? "Generando..." : "Convertir y descargar"}
          </Button>
        </>
      )}
    </Container>
  );
}
