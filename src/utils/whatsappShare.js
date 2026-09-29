import { obtenerBlobDeArchivo } from "../api/tableros";

// Web Share API con archivos (navigator.share/canShare): deja adjuntar el
// PDF real al selector nativo del celular (el usuario elige WhatsApp ahí
// adentro). Soporte limitado — principalmente Chrome/Android, por eso todo
// esto tiene fallback a un link de wa.me con solo texto.
export function soportaCompartirArchivos() {
  return typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;
}

export function armarMensajeWhatsapp({ clienteNombre, archivos, precio }) {
  const lista = archivos.map((a) => `- ${a.nombre}`).join("\n");
  const lineaPrecio = precio != null ? `\n\nTotal: $${precio}` : "";
  return `Hola ${clienteNombre}! Te comparto:\n${lista}${lineaPrecio}`;
}

// Intenta adjuntar los archivos reales vía el selector nativo (Web Share
// API); si el navegador no lo soporta, cae a un link de WhatsApp con el
// mensaje prellenado y el chat de ese contacto ya abierto (sin archivo, hay
// que adjuntarlo a mano ahí adentro).
export async function compartirPorWhatsapp({ mensaje, archivos, telefono }) {
  if (soportaCompartirArchivos()) {
    try {
      const blobs = await Promise.all(archivos.map((a) => obtenerBlobDeArchivo(a.id)));
      const files = blobs.map((blob, i) => new File([blob], archivos[i].nombre, { type: blob.type }));
      if (navigator.canShare({ files })) {
        await navigator.share({ files, text: mensaje });
        return;
      }
    } catch (err) {
      // El usuario cerró el selector nativo sin elegir nada: no es un error,
      // no hay que forzar el fallback de wa.me encima.
      if (err?.name === "AbortError") return;
      // Cualquier otro fallo (no se pudo descargar el archivo, etc.) sigue
      // con el fallback de abajo en vez de dejar la acción a medias.
    }
  }
  const telefonoLimpio = telefono.replace(/\D/g, "");
  window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, "_blank");
}
