// Los 3 modos de DividirPdfPage.jsx convergen en lo mismo: una lista de
// rangos {desde, hasta} (1-indexados, inclusive) sobre las páginas del PDF
// original — funciones puras, fáciles de probar sueltas.

// Reparte totalPaginas en `n` partes lo más parejo posible: si no divide
// exacto, las primeras partes se llevan una página extra (75/4 -> 19,19,19,18).
export function rangosPorCantidad(totalPaginas, n) {
  const base = Math.floor(totalPaginas / n);
  const extra = totalPaginas % n;
  const rangos = [];
  let desde = 1;
  for (let i = 0; i < n; i++) {
    const tamano = base + (i < extra ? 1 : 0);
    if (tamano === 0) break; // n > totalPaginas: no hay más páginas para repartir
    rangos.push({ desde, hasta: desde + tamano - 1 });
    desde += tamano;
  }
  return rangos;
}

// Parte cada `porArchivo` páginas; la última se lleva el resto.
export function rangosPorTamano(totalPaginas, porArchivo) {
  const rangos = [];
  for (let desde = 1; desde <= totalPaginas; desde += porArchivo) {
    rangos.push({ desde, hasta: Math.min(desde + porArchivo - 1, totalPaginas) });
  }
  return rangos;
}

// Un rango tipeado a mano es válido si ambos campos son números enteros
// dentro de 1..totalPaginas y desde <= hasta.
export function rangoValido({ desde, hasta }, totalPaginas) {
  return (
    Number.isInteger(desde) &&
    Number.isInteger(hasta) &&
    desde >= 1 &&
    hasta >= desde &&
    hasta <= totalPaginas
  );
}

export function nombreParte(prefijo, { desde, hasta }) {
  const sufijo = desde === hasta ? `pag${desde}` : `pag${desde}-${hasta}`;
  return `${prefijo}_${sufijo}.pdf`;
}
