const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const CLAVE_STORAGE = "miresumen_auth";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function leerToken() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    return guardado ? JSON.parse(guardado)?.token ?? null : null;
  } catch {
    return null;
  }
}

// Mensaje de FastAPI para errores de validación (422) es una lista de
// objetos, no un string — el resto (401/403/404/400) ya manda `detail` como
// string directo.
function mensajeDeDetail(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return "Ocurrió un error inesperado.";
}

// Wrapper de fetch: arma la URL completa, agrega el JWT si hay uno guardado,
// parsea JSON de la respuesta y convierte los no-2xx en ApiError con el
// `detail` que ya manda la API (mismo formato visto al probarla con curl/PowerShell).
export async function apiFetch(path, { method = "GET", body, headers, ...resto } = {}) {
  const token = leerToken();

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...resto,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      try {
        localStorage.removeItem(CLAVE_STORAGE);
      } catch {
        // si falla, la sesión sigue vencida igual en el próximo request
      }
    }
    throw new ApiError(mensajeDeDetail(datos?.detail), respuesta.status);
  }

  return datos;
}
