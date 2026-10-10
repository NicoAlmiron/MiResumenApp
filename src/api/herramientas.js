import { apiFetch, HERRAMIENTAS_URL } from "./client";

// Herramientas pesadas: viven en el microservicio de herramientas (ver
// MiResumenAPI/app/herramientas_main.py), no en el servicio principal.
const SERVICIO = { base: HERRAMIENTAS_URL };

function formularioConArchivo(archivo) {
  const form = new FormData();
  form.append("archivo", archivo);
  return form;
}

export async function convertirWordAPdf(archivo) {
  const respuesta = await apiFetch("/herramientas/word-a-pdf", {
    method: "POST",
    body: formularioConArchivo(archivo),
    raw: true,
  });
  return respuesta.blob();
}

// El PDF a Word corre en segundo plano: se encola el trabajo, se consulta su
// estado y, cuando está listo, se descarga el .docx.
export function iniciarConversionPdfAWord(archivo) {
  return apiFetch("/trabajos/pdf-a-word", {
    method: "POST",
    body: formularioConArchivo(archivo),
    ...SERVICIO,
  });
}

export function consultarTrabajo(id) {
  return apiFetch(`/trabajos/${id}`, SERVICIO);
}

// Unir archivos en un PDF: se crea el trabajo, se sube cada archivo con su
// posición en la lista (así el orden se respeta aunque se suban en paralelo)
// y después se inicia la unión.
export function crearUnion(nombreSalida) {
  const form = new FormData();
  form.append("nombre_salida", nombreSalida);
  return apiFetch("/trabajos/unir", { method: "POST", body: form, ...SERVICIO });
}

export function subirArchivoAUnion(id, archivo, posicion) {
  const form = formularioConArchivo(archivo);
  form.append("posicion", String(posicion));
  return apiFetch(`/trabajos/${id}/archivos`, { method: "POST", body: form, ...SERVICIO });
}

export function iniciarUnion(id) {
  return apiFetch(`/trabajos/${id}/iniciar`, { method: "POST", ...SERVICIO });
}

export async function descargarTrabajo(id) {
  const respuesta = await apiFetch(`/trabajos/${id}/archivo`, { raw: true, ...SERVICIO });
  return respuesta.blob();
}

// Recorte/enderezado y filtro de fotos ("Imágenes a PDF") — corren en el
// backend (OpenCV real) en vez del navegador.
export async function recortarImagenEnBackend(archivo) {
  const respuesta = await apiFetch("/herramientas/recortar-imagen", {
    method: "POST",
    body: formularioConArchivo(archivo),
    raw: true,
    ...SERVICIO,
  });
  const blob = await respuesta.blob();
  const recorteAplicado = respuesta.headers.get("X-Recorte-Aplicado") === "true";
  const esquinasHeader = respuesta.headers.get("X-Esquinas");
  const esquinas = recorteAplicado && esquinasHeader ? JSON.parse(esquinasHeader) : null;
  return { blob, recorteAplicado, esquinas };
}

export async function recortarImagenManualEnBackend(archivo, esquinas) {
  const form = formularioConArchivo(archivo);
  form.append("esquinas", JSON.stringify(esquinas.flat()));
  const respuesta = await apiFetch("/herramientas/recortar-manual", { method: "POST", body: form, raw: true, ...SERVICIO });
  return respuesta.blob();
}

export async function filtrarImagenEnBackend(archivo) {
  const respuesta = await apiFetch("/herramientas/filtrar-imagen", {
    method: "POST",
    body: formularioConArchivo(archivo),
    raw: true,
    ...SERVICIO,
  });
  return respuesta.blob();
}
