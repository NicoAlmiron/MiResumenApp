import { useState, useRef, useEffect, useCallback } from "react";
import { Container, Form, Button, ButtonGroup, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import ZonaCarga from "../../features/herramientas/ZonaCarga";
import ListaArchivosOrdenable from "../../features/herramientas/ListaArchivosOrdenable";
import { construirPdfDeImagenes, construirPdfConOcr } from "../../utils/imagenesAPdf";
import { detectarYRecortarPagina } from "../../utils/autoRecorte";
import { convertirPdfAWord } from "../../api/herramientas";
import { descargarArchivo } from "../../utils/descargarArchivo";
import { nombrePorDefecto, conExtension } from "../../utils/nombreArchivo";

const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Arma un PDF (o Word) de varias páginas a partir de varias imágenes/fotos —
// todo el armado pasa por el navegador (pdf-lib + Canvas, mismo patrón que
// UnirPdfsPage/DividirPdfPage); para Word se reutiliza el conversor
// PDF->Word que YA pega al backend real (pdf2docx, ver PdfAWordPage.jsx) en
// vez de sumar una librería de generación de .docx en el cliente.
export default function ImagenesAPdfPage() {
  const [imagenes, setImagenes] = useState([]);
  const [autoRecorte, setAutoRecorte] = useState(true);
  const [filtroDocumento, setFiltroDocumento] = useState(false);
  const [formato, setFormato] = useState("pdf"); // "pdf" | "word"
  const [ocr, setOcr] = useState(false);
  const [progresoOcr, setProgresoOcr] = useState("");
  const [nombreSalida, setNombreSalida] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const inputCamaraRef = useRef(null);

  // Los object URL de las miniaturas viven solo en memoria del navegador —
  // hay que liberarlos a mano (quitar una imagen, o al desmontar la página).
  // Via ref para que el cleanup del unmount vea la lista actual, no la del
  // primer render (closure del efecto de cleanup, que solo corre una vez).
  const imagenesRef = useRef(imagenes);
  useEffect(() => {
    imagenesRef.current = imagenes;
  }, [imagenes]);
  useEffect(() => {
    return () => imagenesRef.current.forEach((item) => URL.revokeObjectURL(item.miniatura));
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
      // resultado foto por foto, como un escáner real — y porque la
      // detección es trabajo pesado de CPU, hacerlo todo junto no la
      // acelera (JS es de un solo hilo).
      for (const item of nuevas) {
        let recortada = null;
        try {
          recortada = await detectarYRecortarPagina(item.file);
        } catch {
          recortada = null; // no se pudo detectar/recortar: se deja la foto original
        }
        setImagenes((prev) =>
          prev.map((i) => {
            if (i.id !== item.id) return i;
            if (!recortada) return { ...i, procesando: false };
            URL.revokeObjectURL(i.miniatura);
            return {
              ...i,
              file: new File([recortada], i.nombre, { type: "image/jpeg" }),
              miniatura: URL.createObjectURL(recortada),
              procesando: false,
            };
          })
        );
      }
    },
    [autoRecorte]
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

  async function convertirYDescargar() {
    if (imagenes.length === 0) return;
    setProcesando(true);
    setError("");
    setProgresoOcr("");
    try {
      const usarOcr = formato === "word" && ocr;
      const pdfBytes = usarOcr
        ? await construirPdfConOcr(imagenes, ({ indice, total, fraccion }) =>
            setProgresoOcr(`Reconociendo texto... imagen ${indice + 1} de ${total} (${Math.round(fraccion * 100)}%)`)
          )
        : await construirPdfDeImagenes(imagenes, filtroDocumento);

      if (formato === "pdf") {
        const nombre = conExtension(nombreSalida || nombrePorDefecto("pdf"), "pdf");
        descargarArchivo(pdfBytes, nombre, "application/pdf");
        return;
      }

      setProgresoOcr("");
      const pdfFile = new File([pdfBytes], "imagenes.pdf", { type: "application/pdf" });
      const docx = await convertirPdfAWord(pdfFile);
      const nombre = conExtension(nombreSalida || nombrePorDefecto("docx"), "docx");
      descargarArchivo(docx, nombre, MIME_DOCX);
    } catch {
      setError("Algo falló al generar el archivo. Probá de nuevo.");
    } finally {
      setProcesando(false);
      setProgresoOcr("");
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
        Imágenes a PDF/Word
      </h4>
      <p className="text-body-secondary mb-4">
        Subí varias imágenes (o sacá fotos), ordenalas, y armá un PDF o Word de varias páginas.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

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

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          id="auto-recorte"
          label="Recortar y enderezar automáticamente (como un escáner)"
          checked={autoRecorte}
          onChange={(e) => setAutoRecorte(e.target.checked)}
        />
        <Form.Text>
          Detecta los bordes de la hoja y la endereza sola. Si no la encuentra con confianza (fondo parecido a la
          hoja, foto borrosa), se usa la foto tal cual.
        </Form.Text>
      </Form.Group>

      <ListaArchivosOrdenable items={imagenes} onReordenar={setImagenes} onEliminar={eliminarImagen} />

      {imagenes.length > 0 && (
        <>
          <Form.Check
            type="checkbox"
            id="filtro-documento"
            className="mt-3"
            label="Aplicar filtro tipo escáner (blanco y negro + contraste)"
            checked={filtroDocumento}
            onChange={(e) => setFiltroDocumento(e.target.checked)}
          />

          <ButtonGroup className="mt-3 d-flex">
            <Button variant={formato === "pdf" ? "info" : "outline-info"} onClick={() => setFormato("pdf")}>
              PDF
            </Button>
            <Button variant={formato === "word" ? "info" : "outline-info"} onClick={() => setFormato("word")}>
              Word
            </Button>
          </ButtonGroup>

          {formato === "word" && (
            <Form.Group className="mt-3">
              <Form.Check
                type="checkbox"
                id="ocr-texto"
                label="Reconocer texto (OCR) para un Word editable"
                checked={ocr}
                onChange={(e) => setOcr(e.target.checked)}
              />
              <Form.Text>
                Da buenos resultados en apuntes tipeados/impresos; con letra manuscrita el resultado puede ser pobre.
                Agrega varios segundos de procesamiento por imagen.
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mt-3">
            <Form.Label>Nombre del archivo final</Form.Label>
            <Form.Control
              value={nombreSalida}
              onChange={(e) => setNombreSalida(e.target.value)}
              placeholder={nombrePorDefecto(formato === "pdf" ? "pdf" : "docx")}
            />
          </Form.Group>

          <Button variant="success" className="fw-semibold mt-3" disabled={procesando} onClick={convertirYDescargar}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            {progresoOcr || (procesando ? "Generando..." : "Convertir y descargar")}
          </Button>
        </>
      )}
    </Container>
  );
}
