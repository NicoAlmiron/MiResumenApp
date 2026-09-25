// Dispara la descarga de un archivo generado en memoria (Blob, ArrayBuffer o
// Uint8Array) con un link temporal. Mismo patrón que ya usaba ArchivoCard
// para descargar archivos subidos al tablero, ahora compartido.
export function descargarArchivo(contenido, nombre, tipoMime) {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
