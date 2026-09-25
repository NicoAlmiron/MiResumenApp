// Nombre de archivo por defecto para lo que generan las Herramientas
// (Unir PDFs, PDF a Word, Word a PDF): "MiResumen-dd-mm-aaaa-hh-mm-ss.ext".
export function nombrePorDefecto(extension) {
  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fecha = `${pad(ahora.getDate())}-${pad(ahora.getMonth() + 1)}-${ahora.getFullYear()}`;
  const hora = `${pad(ahora.getHours())}-${pad(ahora.getMinutes())}-${pad(ahora.getSeconds())}`;
  return `MiResumen-${fecha}-${hora}.${extension}`;
}

// Asegura que un nombre elegido por el usuario termine con la extensión
// correcta (por si la borró sin querer al editar el campo).
export function conExtension(nombre, extension) {
  const limpio = nombre.trim();
  return limpio.toLowerCase().endsWith(`.${extension}`) ? limpio : `${limpio}.${extension}`;
}
