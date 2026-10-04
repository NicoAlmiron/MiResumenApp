import { cargarComoBitmap, cerrarBitmap } from "./cargarImagen";

// Versión liviana (lado mayor de `maxLado` px) para miniaturas y el editor.
// Las fotos del celular son de 12 MP o más: mostrarlas completas, varias a la
// vez, hace que el navegador descarte las imágenes. El recorte y el PDF siguen
// usando el archivo completo.
export async function crearVistaPrevia(archivo, maxLado = 900) {
  const bitmap = await cargarComoBitmap(archivo);
  try {
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } finally {
    cerrarBitmap(bitmap);
  }
}
