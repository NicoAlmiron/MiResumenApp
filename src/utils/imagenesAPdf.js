import { PDFDocument } from "pdf-lib";
import { cargarComoBitmap, cerrarBitmap } from "./cargarImagen";
import { filtrarImagenEnBackend } from "../api/herramientas";

// A4 en puntos (72 por pulgada) — cada página del PDF queda en este tamaño,
// listo para imprimir, en vez del tamaño exacto de la foto.
const TAMANO_PAGINA = [595.28, 841.89];

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

// Cada página queda en A4 (ver TAMANO_PAGINA), lista para imprimir — la
// imagen se encaja adentro conservando su proporción (como un visor de PDF
// normal), centrada, no estirada.
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

// Arma un PDF de una página A4 por imagen, en el orden de `imagenes` — cada
// item trae su propio `file` (recortado o no, según el usuario lo haya
// dejado) y su propio `filtro` (blanco y negro activado o no), editables
// individualmente desde la lista (ver ListaImagenesOrdenable).
export async function construirPdfDeImagenes(imagenes) {
  const pdf = await PDFDocument.create();
  for (const item of imagenes) {
    const { blob, width, height } = await procesarImagen(item.file, item.filtro);
    await agregarPaginaDeImagen(pdf, blob, width, height);
  }
  return pdf.save();
}
