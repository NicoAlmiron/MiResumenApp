import { apiFetch } from "./client";

async function convertir(path, archivo) {
  const form = new FormData();
  form.append("archivo", archivo);
  const respuesta = await apiFetch(path, { method: "POST", body: form, raw: true });
  return respuesta.blob();
}

export function convertirWordAPdf(archivo) {
  return convertir("/herramientas/word-a-pdf", archivo);
}

export function convertirPdfAWord(archivo) {
  return convertir("/herramientas/pdf-a-word", archivo);
}

// Recorte/enderezado y filtro de fotos ("Imágenes a PDF/Word") — corren en
// el backend (OpenCV real) en vez del navegador, ver app/services/imagen_service.py.
export async function recortarImagenEnBackend(archivo) {
  const form = new FormData();
  form.append("archivo", archivo);
  const respuesta = await apiFetch("/herramientas/recortar-imagen", { method: "POST", body: form, raw: true });
  const blob = await respuesta.blob();
  const recorteAplicado = respuesta.headers.get("X-Recorte-Aplicado") === "true";
  return { blob, recorteAplicado };
}

export function filtrarImagenEnBackend(archivo) {
  return convertir("/herramientas/filtrar-imagen", archivo);
}
