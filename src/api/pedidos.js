import { apiFetch } from "./client";

// El backend ya resuelve materiaNombre/catedraNombre/etc. por resumen (join
// server-side) — acá solo se traduce snake_case -> camelCase.
function aResumenFrontend(r) {
  return {
    materiaId: r.materia_id,
    materiaNombre: r.materia_nombre,
    catedraId: r.catedra_id,
    catedraNombre: r.catedra_nombre,
    comisionId: r.comision_id,
    comisionNombre: r.comision_nombre,
    resumenNombre: r.resumen_nombre,
    anio: r.anio,
  };
}

function aPedidoFrontend(p) {
  return {
    id: p.id,
    contactoNombre: p.contacto_nombre,
    contactoTelefono: p.contacto_telefono,
    precio: p.precio,
    fecha: p.fecha.slice(0, 10),
    resumenes: p.resumenes.map(aResumenFrontend),
  };
}

export async function listarPedidos() {
  const datos = await apiFetch("/pedidos");
  return datos.map(aPedidoFrontend);
}

export async function crearPedido({ contactoNombre, contactoTelefono, precio, tableroIds }) {
  const datos = await apiFetch("/pedidos", {
    method: "POST",
    body: { contacto_nombre: contactoNombre, contacto_telefono: contactoTelefono, precio, tablero_ids: tableroIds },
  });
  return aPedidoFrontend(datos);
}

export async function eliminarPedido(id) {
  await apiFetch(`/pedidos/${id}`, { method: "DELETE" });
}
