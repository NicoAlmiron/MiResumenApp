import { PDFDocument } from "pdf-lib";

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

// Arma un PDF de una página por imagen, en el orden de `imagenes`, cada
// página del tamaño exacto de su imagen — mismo patrón PDFDocument/addPage
// que ya usan UnirPdfsPage/DividirPdfPage.
export async function construirPdfDeImagenes(imagenes, aplicarFiltro) {
  const pdf = await PDFDocument.create();
  for (const item of imagenes) {
    const { blob, width, height } = await procesarImagen(item.file, aplicarFiltro);
    const bytesImagen = await blob.arrayBuffer();
    const imagen = await pdf.embedJpg(bytesImagen);
    const pagina = pdf.addPage([width, height]);
    pagina.drawImage(imagen, { x: 0, y: 0, width, height });
  }
  return pdf.save();
}
