import { PDFDocument, StandardFonts } from "pdf-lib";
import { reconocerTextoDeLote } from "./ocrTexto";

// A4 en puntos (72 por pulgada) — tamaño de página para los PDF armados a
// partir de texto (OCR), ya que ahí no hay una imagen que les marque el
// tamaño como en construirPdfDeImagenes.
const TAMANO_PAGINA = [595.28, 841.89];
const MARGEN = 50;
const TAMANO_FUENTE = 11;
const INTERLINEADO = 14;

// Sube el contraste y lleva a blanco y negro — look "escaneado" clásico
// (texto nítido, fondo claro). No endereza perspectiva ni recorta bordes,
// eso requeriría detección de bordes/visión por computadora (descartado,
// ver plan: demasiado pesado para lo que hace falta acá).
const CONTRASTE = 1.6;
const BRILLO = 25;

function aplicarFiltroDocumento(datos) {
  const { data } = datos;
  for (let i = 0; i < data.length; i += 4) {
    const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const valor = Math.max(0, Math.min(255, (gris - 128) * CONTRASTE + 128 + BRILLO));
    data[i] = data[i + 1] = data[i + 2] = valor;
  }
}

// Dibuja el File en un canvas offscreen (createImageBitmap decodifica
// cualquier formato que el navegador entienda: JPEG/PNG/WEBP/GIF/...),
// aplica el filtro si corresponde, y siempre re-codifica a JPEG — esto de
// paso normaliza el formato de entrada a algo que pdf-lib sabe embeber,
// sea cual sea el archivo original.
export async function procesarImagen(file, aplicarFiltro) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  if (aplicarFiltro) {
    const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
    aplicarFiltroDocumento(datos);
    ctx.putImageData(datos, 0, 0);
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
