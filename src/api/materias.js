import { apiFetch } from "./client";

// El árbol que devuelve GET /materias ya viene anidado (materia -> catedras
// -> comisiones) con los mismos nombres de campo que necesita el frontend
// (nombre, profesor, turno, anio, cuatrimestre, descripcion) salvo `id` (acá
// siempre viene como `id`, ver *Out schemas del backend) — no hace falta
// transformar nada más que agregar `vecesCompartido`/`tablero` (eso lo hace
// MateriasContext después, con /tableros).
export async function listarMaterias() {
  return apiFetch("/materias");
}

export async function crearMateria(datos) {
  return apiFetch("/materias", {
    method: "POST",
    body: { nombre: datos.nombre, anio: datos.anio ?? null, cuatrimestre: datos.cuatrimestre ?? null, descripcion: datos.descripcion ?? null },
  });
}

export async function actualizarMateria(id, cambios) {
  return apiFetch(`/materias/${id}`, { method: "PATCH", body: cambios });
}

export async function eliminarMateria(id) {
  await apiFetch(`/materias/${id}`, { method: "DELETE" });
}

export async function crearCatedra(materiaId, { nombre, profesor }) {
  return apiFetch(`/materias/${materiaId}/catedras`, { method: "POST", body: { nombre, profesor: profesor ?? null } });
}

export async function actualizarCatedra(id, cambios) {
  return apiFetch(`/catedras/${id}`, { method: "PATCH", body: cambios });
}

export async function eliminarCatedra(id) {
  await apiFetch(`/catedras/${id}`, { method: "DELETE" });
}

export async function crearComision(catedraId, { nombre, turno }) {
  return apiFetch(`/catedras/${catedraId}/comisiones`, { method: "POST", body: { nombre, turno: turno ?? null } });
}

export async function actualizarComision(id, cambios) {
  return apiFetch(`/comisiones/${id}`, { method: "PATCH", body: cambios });
}

export async function eliminarComision(id) {
  await apiFetch(`/comisiones/${id}`, { method: "DELETE" });
}
