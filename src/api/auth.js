import { apiFetch } from "./client";

// El backend usa snake_case (nombre_usuario) y expone `id`/`rol` planos —
// esto ya coincide con lo que el resto de la app espera de un usuario
// público (ver AuthContext.jsx `aPublico`), salvo el nombre del campo.
function aUsuarioPublico(u) {
  return { id: u.id, nombreUsuario: u.nombre_usuario, rol: u.rol, googleId: u.google_id, driveConectado: u.drive_conectado };
}

export async function login(nombreUsuario, password) {
  const datos = await apiFetch("/auth/login", {
    method: "POST",
    body: { nombre_usuario: nombreUsuario, password },
  });
  return { token: datos.access_token, usuario: aUsuarioPublico(datos.usuario) };
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
}

export async function obtenerMe() {
  const datos = await apiFetch("/auth/me");
  return aUsuarioPublico(datos);
}

export async function actualizarMe({ nombreUsuario, passwordActual, passwordNueva }) {
  const datos = await apiFetch("/auth/me", {
    method: "PUT",
    body: {
      nombre_usuario: nombreUsuario ?? null,
      password_actual: passwordActual ?? null,
      password_nueva: passwordNueva ?? null,
    },
  });
  return aUsuarioPublico(datos);
}

export async function listarUsuarios() {
  const datos = await apiFetch("/usuarios");
  return datos.map(aUsuarioPublico);
}

export async function crearUsuario({ nombreUsuario, password, rol }) {
  const datos = await apiFetch("/usuarios", {
    method: "POST",
    body: { nombre_usuario: nombreUsuario, password, rol },
  });
  return aUsuarioPublico(datos);
}

export async function cambiarRolUsuario(id, rol) {
  const datos = await apiFetch(`/usuarios/${id}/rol`, { method: "PATCH", body: { rol } });
  return aUsuarioPublico(datos);
}

export async function eliminarUsuario(id) {
  await apiFetch(`/usuarios/${id}`, { method: "DELETE" });
}

export async function vincularGoogle(idToken) {
  const datos = await apiFetch("/auth/me/google", { method: "PUT", body: { id_token: idToken } });
  return aUsuarioPublico(datos);
}

export async function desvincularGoogle() {
  const datos = await apiFetch("/auth/me/google", { method: "DELETE" });
  return aUsuarioPublico(datos);
}

export async function conectarDrive(code) {
  const datos = await apiFetch("/auth/me/drive", { method: "POST", body: { code } });
  return aUsuarioPublico(datos);
}

export async function desconectarDrive() {
  const datos = await apiFetch("/auth/me/drive", { method: "DELETE" });
  return aUsuarioPublico(datos);
}
