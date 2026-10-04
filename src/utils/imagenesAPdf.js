import { PDFDocument } from "pdf-lib";
import { reducirImagen } from "./vistaPrevia";

import { filtrarImagenEnBackend } from "../api/herramientas";

// Lado mayor de la imagen embebida: alcanza de sobra para una hoja A4 a
// buena resolución, y mantiene el PDF y la memoria del celular bajo control.
const LADO_MAXIMO_PDF = 2200;

// A4 en puntos (72 por pulgada) — cada página del PDF queda en este tamaño,
// listo para imprimir, en vez del tamaño exacto de la foto.
const TAMANO_PAGINA = [595.28, 841.89];

// Reduce la foto (createImageBitmap decodifica cualquier formato que el navegador
// entienda) y la re-codifica a JPEG, para que pdf-lib la pueda embeber. El
// filtro tipo escáner corre en el backend (ver app/services/imagen_service.py).
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

  return reducirImagen(archivoFinal, LADO_MAXIMO_PDF);
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
    try {
      const { blob, width, height } = await procesarImagen(item.file, item.filtro);
      await agregarPaginaDeImagen(pdf, blob, width, height);
    } catch (err) {
      throw new Error(`No se pudo procesar "${item.nombre}": ${err.message}`);
    }
  }
  return pdf.save();
}
