// Safari/WebKit tiene un bug conocido donde createImageBitmap puede fallar
// con "InvalidStateError: An error occured reading the Blob argument" para
// ciertos JPEG (ej. de fotos sacadas en el momento) que sí decodifica bien
// por el camino normal de una <img> — acá se intenta createImageBitmap
// primero (más rápido, libera memoria con .close()) y si falla se cae a
// cargarlo como <img>, que sirve igual de bien como fuente para drawImage.
export async function cargarComoBitmap(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("No se pudo decodificar la imagen."));
        img.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// HTMLImageElement no tiene .close() (solo ImageBitmap) — liberar memoria
// cuando corresponda sin que explote si vino del camino de respaldo.
export function cerrarBitmap(bitmap) {
  if (typeof bitmap.close === "function") bitmap.close();
}
