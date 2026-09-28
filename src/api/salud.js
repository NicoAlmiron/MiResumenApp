import { apiFetch } from "./client";

// Ping de mantenimiento — ver AuthContext.jsx, se llama cada tanto mientras
// haya sesión activa para que miresumenapi (y de paso Gotenberg) no lleguen
// a los 15 min de inactividad que hacen que Render los duerma.
export async function ping() {
  await apiFetch("/salud").catch(() => {});
}
