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
