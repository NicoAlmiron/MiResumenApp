import { apiFetch } from "./client";
import { descargarArchivo as dispararDescarga } from "../utils/descargarArchivo";

const COLUMNA_BACKEND_A_FRONTEND = { documentos: "documentos", en_edicion: "enEdicion", listo: "listo" };

function aArchivoFrontend(a) {
  return {
    id: a.id,
    nombre: a.nombre,
    extension: a.extension,
    fechaActualizado: a.fecha_actualizado.slice(0, 10),
    driveViewLink: a.drive_view_link,
  };
}

// Traduce la respuesta de GET .../tablero (lista plana de archivos con
// `columna`) al shape que ya espera el frontend: { documentos, enEdicion,
// listo } + vecesCompartido aparte (MateriasContext lo mergea en la hoja).
export function aTableroFrontend(tableroBackend) {
  const tablero = { documentos: [], enEdicion: [], listo: [] };
  for (const archivo of tableroBackend.archivos) {
    const clave = COLUMNA_BACKEND_A_FRONTEND[archivo.columna];
    tablero[clave].push(aArchivoFrontend(archivo));
  }
  return { tableroId: tableroBackend.id, vecesCompartido: tableroBackend.veces_compartido, tablero };
}

export async function obtenerTableroDeCatedra(catedraId) {
  return aTableroFrontend(await apiFetch(`/catedras/${catedraId}/tablero`));
}

export async function obtenerTableroDeComision(comisionId) {
  return aTableroFrontend(await apiFetch(`/comisiones/${comisionId}/tablero`));
}

const COLUMNA_FRONTEND_A_BACKEND = { documentos: "documentos", enEdicion: "en_edicion", listo: "listo" };

// `archivo` es el File real (input/drag&drop) — se manda como multipart, el
// backend lo sube a Drive antes de guardar la fila.
export async function subirArchivo(tableroId, archivo, columnaFrontend) {
  const form = new FormData();
  form.append("archivo", archivo);
  form.append("columna", COLUMNA_FRONTEND_A_BACKEND[columnaFrontend]);
  return apiFetch(`/tableros/${tableroId}/archivos`, { method: "POST", body: form });
}

export async function moverArchivo(archivoId, columnaDestinoFrontend) {
  return apiFetch(`/archivos/${archivoId}`, {
    method: "PATCH",
    body: { columna_destino: COLUMNA_FRONTEND_A_BACKEND[columnaDestinoFrontend] },
  });
}

export async function eliminarArchivo(archivoId) {
  await apiFetch(`/archivos/${archivoId}`, { method: "DELETE" });
}

// Trae el archivo real desde el backend (que a su vez lo pide a Drive con el
// token de quien lo subió) — base común para descargarlo al disco o, por
// ejemplo, adjuntarlo a un share nativo (ver utils/whatsappShare.js).
export async function obtenerBlobDeArchivo(archivoId) {
  const respuesta = await apiFetch(`/archivos/${archivoId}/descargar`, { raw: true });
  return respuesta.blob();
}

export async function descargarArchivoDelTablero(archivoId, nombre) {
  dispararDescarga(await obtenerBlobDeArchivo(archivoId), nombre);
}
