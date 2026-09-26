import { apiFetch } from "./client";

const COLUMNA_BACKEND_A_FRONTEND = { documentos: "documentos", en_edicion: "enEdicion", listo: "listo" };

function aArchivoFrontend(a) {
  return { id: a.id, nombre: a.nombre, extension: a.extension, fechaActualizado: a.fecha_actualizado.slice(0, 10) };
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

export async function subirArchivo(tableroId, nombre, columnaFrontend) {
  return apiFetch(`/tableros/${tableroId}/archivos`, {
    method: "POST",
    body: { nombre, columna: COLUMNA_FRONTEND_A_BACKEND[columnaFrontend] },
  });
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
