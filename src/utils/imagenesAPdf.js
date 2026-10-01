import { PDFDocument, StandardFonts } from "pdf-lib";
import { reconocerTextoDeLote } from "./ocrTexto";
import { obtenerCv } from "./opencv";
import { cargarComoBitmap, cerrarBitmap } from "./cargarImagen";

// A4 en puntos (72 por pulgada) — tamaño de página para los PDF armados a
// partir de texto (OCR), ya que ahí no hay una imagen que les marque el
// tamaño como en construirPdfDeImagenes.
const TAMANO_PAGINA = [595.28, 841.89];
const MARGEN = 50;
const TAMANO_FUENTE = 11;
const INTERLINEADO = 14;

// Fotos de celular reales pueden ser enormes (10+ MP) — sin esto, OpenCV
// procesa a resolución completa y puede quedarse sin memoria en el
// navegador (sobre todo en celulares). Un documento escaneado no necesita
// tanta resolución para quedar legible, así que se achica antes de filtrar
// si hace falta (a diferencia del recorte, acá el resultado de este achique
// SÍ queda como salida final, no es solo para detectar).
const MAX_LADO_FILTRO = 2200;

function limitarResolucion(canvas) {
  const escala = Math.min(1, MAX_LADO_FILTRO / Math.max(canvas.width, canvas.height));
  if (escala >= 1) return;
  const anchoChico = Math.round(canvas.width * escala);
  const altoChico = Math.round(canvas.height * escala);
  const temporal = document.createElement("canvas");
  temporal.width = canvas.width;
  temporal.height = canvas.height;
  temporal.getContext("2d").drawImage(canvas, 0, 0);
  canvas.width = anchoChico;
  canvas.height = altoChico;
  canvas.getContext("2d").drawImage(temporal, 0, 0, anchoChico, altoChico);
}

// Blanco y negro tipo "escáner" con umbral ADAPTATIVO (no un contraste
// global fijo): cada zona de la imagen se compara contra el promedio de su
// propio entorno, no contra un valor fijo para toda la foto — así no se
// "quema" a blanco el texto en fotos con luz despareja o algo sobreexpuestas
// (lo que pasaba antes con un simple ajuste de contraste/brillo global).
// blockSize se escala con la resolución (fotos de celular son enormes, un
// tamaño de ventana fijo en píxeles no tendría sentido en todas).
async function aplicarFiltroDocumento(canvas) {
  const cv = await obtenerCv();
  limitarResolucion(canvas);
  const src = cv.imread(canvas);
  const gris = new cv.Mat();
  const resultado = new cv.Mat();
  try {
    cv.cvtColor(src, gris, cv.COLOR_RGBA2GRAY);
    let blockSize = Math.round(Math.min(canvas.width, canvas.height) * 0.025);
    if (blockSize % 2 === 0) blockSize += 1;
    blockSize = Math.max(15, blockSize);
    cv.adaptiveThreshold(gris, resultado, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, 15);
    cv.imshow(canvas, resultado);
  } finally {
    src.delete();
    gris.delete();
    resultado.delete();
  }
}

// Dibuja el File en un canvas offscreen (createImageBitmap decodifica
// cualquier formato que el navegador entienda: JPEG/PNG/WEBP/GIF/...),
// aplica el filtro si corresponde, y siempre re-codifica a JPEG — esto de
// paso normaliza el formato de entrada a algo que pdf-lib sabe embeber,
// sea cual sea el archivo original.
export async function procesarImagen(file, aplicarFiltro) {
  const bitmap = await cargarComoBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  cerrarBitmap(bitmap);

  if (aplicarFiltro) {
    await aplicarFiltroDocumento(canvas);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return { blob, width: canvas.width, height: canvas.height };
}

async function agregarPaginaDeImagen(pdf, blob, width, height) {
  const bytesImagen = await blob.arrayBuffer();
  const imagen = await pdf.embedJpg(bytesImagen);
  const pagina = pdf.addPage([width, height]);
  pagina.drawImage(imagen, { x: 0, y: 0, width, height });
}

// Arma un PDF de una página por imagen, en el orden de `imagenes`, cada
// página del tamaño exacto de su imagen — mismo patrón PDFDocument/addPage
// que ya usan UnirPdfsPage/DividirPdfPage.
export async function construirPdfDeImagenes(imagenes, aplicarFiltro) {
  const pdf = await PDFDocument.create();
  for (const item of imagenes) {
    const { blob, width, height } = await procesarImagen(item.file, aplicarFiltro);
    await agregarPaginaDeImagen(pdf, blob, width, height);
  }
  return pdf.save();
}

// Parte `texto` en líneas que entran en `anchoMax` a `tamanoFuente` — wrap
// manual por palabra, respeta los saltos de línea que ya trae el texto.
function envolverTexto(texto, font, tamanoFuente, anchoMax) {
  const lineas = [];
  for (const parrafo of texto.split("\n")) {
    if (parrafo.trim() === "") {
      lineas.push("");
      continue;
    }
    let lineaActual = "";
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      if (lineaActual && font.widthOfTextAtSize(prueba, tamanoFuente) > anchoMax) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = prueba;
      }
    }
    lineas.push(lineaActual);
  }
  return lineas;
}

// Agrega tantas páginas A4 como hagan falta para que entre todo `texto`
// (una imagen con mucho texto puede no entrar en una sola página).
function agregarPaginasDeTexto(pdf, font, texto) {
  const [anchoPagina, altoPagina] = TAMANO_PAGINA;
  const lineas = envolverTexto(texto, font, TAMANO_FUENTE, anchoPagina - MARGEN * 2);

  let pagina = pdf.addPage(TAMANO_PAGINA);
  let y = altoPagina - MARGEN;
  for (const linea of lineas) {
    if (y < MARGEN) {
      pagina = pdf.addPage(TAMANO_PAGINA);
      y = altoPagina - MARGEN;
    }
    if (linea !== "") pagina.drawText(linea, { x: MARGEN, y: y - TAMANO_FUENTE, size: TAMANO_FUENTE, font });
    y -= INTERLINEADO;
  }
}

// Arma un PDF con el texto reconocido por OCR de cada imagen (ver
// construirPdfConOcr) — sin importar el OCR, puede ser útil suelta.
export async function construirPdfDeTexto(paginasDeTexto) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const texto of paginasDeTexto) agregarPaginasDeTexto(pdf, font, texto);
  return pdf.save();
}

// Como construirPdfDeImagenes, pero en vez de embeber la foto reconoce el
// texto (OCR, ver ocrTexto.js) y arma esa página con texto real — así el
// conversor PDF->Word que ya existe (pdf2docx, backend) tiene texto de
// verdad para analizar y arma un Word editable en vez de una foto pegada.
// Si el OCR no reconoce nada en alguna imagen (en blanco, mala calidad), esa
// página puntual cae al comportamiento de siempre (imagen embebida) — no se
// pierde contenido aunque el OCR falle en una.
export async function construirPdfConOcr(imagenes, onProgreso) {
  const procesadas = await Promise.all(imagenes.map((item) => procesarImagen(item.file, true)));
  const textos = await reconocerTextoDeLote(
    procesadas.map((p) => p.blob),
    onProgreso
  );

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < imagenes.length; i++) {
    const texto = textos[i];
    if (texto) {
      agregarPaginasDeTexto(pdf, font, texto);
    } else {
      const { blob, width, height } = procesadas[i];
      await agregarPaginaDeImagen(pdf, blob, width, height);
    }
  }
  return pdf.save();
}
