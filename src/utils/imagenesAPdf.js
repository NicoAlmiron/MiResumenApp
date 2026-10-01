import { PDFDocument, StandardFonts } from "pdf-lib";
import { reconocerTextoDeLote } from "./ocrTexto";
import { cargarComoBitmap, cerrarBitmap } from "./cargarImagen";
import { filtrarImagenEnBackend } from "../api/herramientas";

// A4 en puntos (72 por pulgada) — tamaño de página para los PDF armados a
// partir de texto (OCR), ya que ahí no hay una imagen que les marque el
// tamaño como en construirPdfDeImagenes.
const TAMANO_PAGINA = [595.28, 841.89];
const MARGEN = 50;
const TAMANO_FUENTE = 11;
const INTERLINEADO = 14;

// Dibuja el File en un canvas offscreen (createImageBitmap decodifica
// cualquier formato que el navegador entienda: JPEG/PNG/WEBP/GIF/...) y
// siempre re-codifica a JPEG — esto de paso normaliza el formato de entrada
// a algo que pdf-lib sabe embeber, sea cual sea el archivo original. El
// filtro tipo escáner corre en el backend (OpenCV real, ver
// app/services/imagen_service.py) — acá solo se sube la foto.
export async function procesarImagen(file, aplicarFiltro) {
  let archivoFinal = file;
  if (aplicarFiltro) {
    try {
      archivoFinal = await filtrarImagenEnBackend(file);
    } catch (err) {
      // Si falla (red caída, etc.) se sigue con la imagen tal cual en vez
      // de cortar la generación entera por esto.
      console.error("No se pudo aplicar el filtro, se usa la imagen sin filtrar:", err);
    }
  }

  const bitmap = await cargarComoBitmap(archivoFinal);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  cerrarBitmap(bitmap);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return { blob, width: canvas.width, height: canvas.height };
}

// Cada página queda en A4 (igual que las de texto, ver TAMANO_PAGINA) en vez
// del tamaño exacto de la foto, lista para imprimir — la imagen se encaja
// adentro conservando su proporción (como un visor de PDF normal), centrada,
// no estirada.
async function agregarPaginaDeImagen(pdf, blob, width, height) {
  const bytesImagen = await blob.arrayBuffer();
  const imagen = await pdf.embedJpg(bytesImagen);
  const [anchoPagina, altoPagina] = TAMANO_PAGINA;
  const pagina = pdf.addPage(TAMANO_PAGINA);
  const escala = Math.min(anchoPagina / width, altoPagina / height);
  const anchoFinal = width * escala;
  const altoFinal = height * escala;
  pagina.drawImage(imagen, {
    x: (anchoPagina - anchoFinal) / 2,
    y: (altoPagina - altoFinal) / 2,
    width: anchoFinal,
    height: altoFinal,
  });
}

// Arma un PDF de una página A4 por imagen, en el orden de `imagenes`, lista
// para imprimir — mismo patrón PDFDocument/addPage que ya usan
// UnirPdfsPage/DividirPdfPage.
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
