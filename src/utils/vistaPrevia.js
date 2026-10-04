import { cargarComoBitmap, cerrarBitmap } from "./cargarImagen";

// Reduce la foto a un JPEG de lado mayor `maxLado` px. Las fotos del celular
// son de 12 MP o más: decodificarlas completas, varias a la vez, hace que el
// navegador del celular descarte imágenes. El recorte y el PDF usan estas
// versiones (o el archivo completo solo cuando hace falta).
export async function reducirImagen(archivo, maxLado) {
  const bitmap = await cargarComoBitmap(archivo);
  try {
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    cerrarBitmap(bitmap);
  }
}

export async function crearVistaPrevia(archivo, maxLado = 900) {
  return (await reducirImagen(archivo, maxLado)).blob;
}
