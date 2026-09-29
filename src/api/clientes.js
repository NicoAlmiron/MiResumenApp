import { apiFetch } from "./client";

function aClienteFrontend(c) {
  return { id: c.id, nombre: c.nombre, telefono: c.telefono };
}

export async function listarClientes() {
  const datos = await apiFetch("/clientes");
  return datos.map(aClienteFrontend);
}

export async function crearCliente({ nombre, telefono }) {
  const datos = await apiFetch("/clientes", { method: "POST", body: { nombre, telefono } });
  return aClienteFrontend(datos);
}
