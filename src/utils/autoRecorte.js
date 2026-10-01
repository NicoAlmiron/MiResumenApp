import { obtenerCv } from "./opencv";

// Reduce la imagen a esto (lado más largo) solo para la etapa de detección
// de bordes — las fotos de celular son enormes y correr Canny/contornos a
// resolución completa sería lento (los puntos detectados se reescalan para
// el recorte final, que usa su propio límite, ver MAX_LADO_SALIDA).
const MAX_LADO_DETECCION = 1200;
// Límite para el recorte final (no solo para detectar) — ver nota en
// detectarYRecortarPagina. Mismo valor que usa el filtro en imagenesAPdf.js.
const MAX_LADO_SALIDA = 2200;
const AREA_MINIMA_FRACCION = 0.1;
// Con umbrales de Canny más permisivos, a veces "se detecta" el borde del
// encuadre de la foto entera como si fuera la hoja (falso positivo clásico:
// JPEG/antialiasing deja un borde parejo justo en el límite de la imagen).
// Una hoja real casi nunca toca los 4 bordes del encuadre sin margen, así
// que se descarta cualquier candidato que ocupe casi toda la imagen.
const AREA_MAXIMA_FRACCION = 0.95;
// Fotos reales (fondo con textura, luz despareja, sombras) no siempre dan un
// buen resultado con un solo umbral de Canny ni con un solo epsilon de
// aproximación de polígono — se prueban varias combinaciones antes de
// rendirse, más tolerante que un único intento "ideal". Los umbrales fijos
// cubren un rango amplio de sensibilidad; a esos se les suma un par
// calculado automáticamente por imagen (ver umbralesAutomaticos) porque la
// exposición de una foto real varía mucho de una a otra.
const PARES_CANNY = [
  [50, 150],
  [30, 90],
  [75, 200],
  [20, 60],
];
const EPSILONS_APROX = [0.01, 0.02, 0.03, 0.05, 0.08];

// Umbral de Otsu (se calcula solo, según el histograma de la imagen) para
// derivar un par de Canny ajustado a la exposición real de esta foto en
// particular, en vez de depender solo de los valores fijos de arriba.
function umbralesAutomaticos(cv, grisDifuminado) {
  const binaria = new cv.Mat();
  try {
    const otsu = cv.threshold(grisDifuminado, binaria, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    return [otsu * 0.5, otsu];
  } finally {
    binaria.delete();
  }
}

function ordenarPuntos([a, b, c, d]) {
  const pts = [a, b, c, d];
  const sumas = pts.map((p) => p.x + p.y);
  const diffs = pts.map((p) => p.y - p.x);
  const arribaIzq = pts[sumas.indexOf(Math.min(...sumas))];
  const abajoDer = pts[sumas.indexOf(Math.max(...sumas))];
  const arribaDer = pts[diffs.indexOf(Math.min(...diffs))];
  const abajoIzq = pts[diffs.indexOf(Math.max(...diffs))];
  return [arribaIzq, arribaDer, abajoDer, abajoIzq];
}

function distancia(p, q) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// Busca el cuadrilátero más grande (con área mínima) en `mat` — recorrido
// estándar de "escáner de documentos": bordes (Canny) -> contornos ->
// aproximar cada uno a un polígono -> quedarse con el mejor de 4 vértices.
// Prueba varios umbrales de Canny y varios epsilon de aproximación (fotos
// reales rara vez dan un contorno de 4 vértices "limpio" al primer intento).
// Si ningún intento da 4 vértices pero sí hay un contorno grande evidente,
// cae a su rectángulo rotado de área mínima (corrige rotación simple, no
// distorsión de perspectiva fina, pero es mejor que no recortar nada).
// Devuelve un cv.Mat (4x1, CV_32SC2) que el que llama debe liberar, o null.
function buscarCuadrilatero(cv, mat) {
  const gris = new cv.Mat();
  const difuminado = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const areaTotal = mat.cols * mat.rows;
  const areaMinima = areaTotal * AREA_MINIMA_FRACCION;
  const areaMaxima = areaTotal * AREA_MAXIMA_FRACCION;

  let mejorCuadrilatero = null;
  let mejorAreaCuadrilatero = 0;
  let mejorContornoGrande = null;
  let mejorAreaGrande = 0;

  try {
    cv.cvtColor(mat, gris, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gris, difuminado, new cv.Size(5, 5), 0);

    const pares = [...PARES_CANNY, umbralesAutomaticos(cv, difuminado)];
    for (const [t1, t2] of pares) {
      const bordes = new cv.Mat();
      const dilatado = new cv.Mat();
      const contornos = new cv.MatVector();
      const jerarquia = new cv.Mat();
      try {
        cv.Canny(difuminado, bordes, t1, t2);
        cv.dilate(bordes, dilatado, kernel);
        // RETR_EXTERNAL: solo los contornos de afuera (el borde de la hoja),
        // ignora los de adentro (texto, líneas) — no sirven para esto.
        cv.findContours(dilatado, contornos, jerarquia, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        for (let i = 0; i < contornos.size(); i++) {
          const contorno = contornos.get(i);
          const area = cv.contourArea(contorno);
          const tamanoRazonable = area > areaMinima && area < areaMaxima;

          if (tamanoRazonable && area > mejorAreaGrande) {
            mejorAreaGrande = area;
            if (mejorContornoGrande) mejorContornoGrande.delete();
            mejorContornoGrande = contorno.clone();
          }

          if (tamanoRazonable && area > mejorAreaCuadrilatero) {
            const perimetro = cv.arcLength(contorno, true);
            for (const eps of EPSILONS_APROX) {
              const aprox = new cv.Mat();
              cv.approxPolyDP(contorno, aprox, eps * perimetro, true);
              const areaAprox = cv.contourArea(aprox);
              const sirve =
                aprox.rows === 4 &&
                areaAprox > areaMinima &&
                areaAprox < areaMaxima &&
                areaAprox > mejorAreaCuadrilatero &&
                cv.isContourConvex(aprox);
              if (sirve) {
                if (mejorCuadrilatero) mejorCuadrilatero.delete();
                mejorCuadrilatero = aprox;
                mejorAreaCuadrilatero = areaAprox;
                break;
              }
              aprox.delete();
            }
          }
          contorno.delete();
        }
      } finally {
        bordes.delete();
        dilatado.delete();
        contornos.delete();
        jerarquia.delete();
      }
    }

    if (mejorCuadrilatero) {
      if (mejorContornoGrande) mejorContornoGrande.delete();
      return mejorCuadrilatero;
    }
    if (mejorContornoGrande) {
      const rect = cv.minAreaRect(mejorContornoGrande);
      mejorContornoGrande.delete();
      const vertices = cv.RotatedRect.points(rect);
      const datos = [];
      for (const v of vertices) datos.push(v.x, v.y);
      return cv.matFromArray(4, 1, cv.CV_32SC2, datos);
    }
    return null;
  } finally {
    gris.delete();
    difuminado.delete();
    kernel.delete();
  }
}

// Detecta los 4 bordes de una hoja en `file` y devuelve la foto recortada y
// enderezada (perspectiva corregida) como Blob — o `null` si no encontró un
// cuadrilátero con confianza suficiente (fondo complicado, foto borrosa,
// ángulo imposible). Quien llama debe usar la foto original en ese caso
// (ver ImagenesAPdfPage.jsx) — mismo espíritu de fallback silencioso que ya
// usa el OCR cuando no reconoce texto en alguna imagen.
export async function detectarYRecortarPagina(file) {
  const cv = await obtenerCv();
  const bitmap = await createImageBitmap(file);
  const anchoOriginal = bitmap.width;
  const altoOriginal = bitmap.height;

  // El resultado final tampoco necesita la resolución completa de una foto
  // de celular real (10+ MP) — además de ser innecesario para que quede
  // legible, correr warpPerspective sobre eso puede quedarse sin memoria en
  // el navegador (sobre todo en celulares). Mismo límite que usa el filtro
  // en imagenesAPdf.js, por consistencia.
  const escalaSalida = Math.min(1, MAX_LADO_SALIDA / Math.max(anchoOriginal, altoOriginal));
  const canvasOrigen = document.createElement("canvas");
  canvasOrigen.width = Math.round(anchoOriginal * escalaSalida);
  canvasOrigen.height = Math.round(altoOriginal * escalaSalida);
  canvasOrigen.getContext("2d").drawImage(bitmap, 0, 0, canvasOrigen.width, canvasOrigen.height);

  const escalaDeteccion = Math.min(1, MAX_LADO_DETECCION / Math.max(anchoOriginal, altoOriginal));
  const canvasChico = document.createElement("canvas");
  canvasChico.width = Math.round(anchoOriginal * escalaDeteccion);
  canvasChico.height = Math.round(altoOriginal * escalaDeteccion);
  canvasChico.getContext("2d").drawImage(bitmap, 0, 0, canvasChico.width, canvasChico.height);
  bitmap.close();

  const src = cv.imread(canvasOrigen);
  const chico = cv.imread(canvasChico);
  let cuadrilatero = null;

  try {
    cuadrilatero = buscarCuadrilatero(cv, chico);
    if (!cuadrilatero) return null;

    // Los puntos salen en el espacio de canvasChico — se reescalan al
    // espacio de canvasOrigen (que puede ser más chico que la foto real,
    // ver escalaSalida arriba), no a la resolución original de la foto.
    const factor = escalaSalida / escalaDeteccion;
    const datos = cuadrilatero.data32S; // [x0,y0, x1,y1, x2,y2, x3,y3] a resolución chica
    const puntosChicos = [0, 1, 2, 3].map((i) => ({ x: datos[i * 2], y: datos[i * 2 + 1] }));
    const [tl, tr, br, bl] = ordenarPuntos(puntosChicos).map((p) => ({ x: p.x * factor, y: p.y * factor }));

    const anchoDestino = Math.round(Math.max(distancia(br, bl), distancia(tr, tl)));
    const altoDestino = Math.round(Math.max(distancia(tr, br), distancia(tl, bl)));
    if (anchoDestino < 10 || altoDestino < 10) return null;

    const matOrigen = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
    const matDestino = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0, anchoDestino - 1, 0, anchoDestino - 1, altoDestino - 1, 0, altoDestino - 1,
    ]);
    const transformacion = cv.getPerspectiveTransform(matOrigen, matDestino);
    const resultado = new cv.Mat();
    try {
      cv.warpPerspective(src, resultado, transformacion, new cv.Size(anchoDestino, altoDestino));
      const canvasSalida = document.createElement("canvas");
      canvasSalida.width = anchoDestino;
      canvasSalida.height = altoDestino;
      cv.imshow(canvasSalida, resultado);
      return await new Promise((resolve) => canvasSalida.toBlob(resolve, "image/jpeg", 0.92));
    } finally {
      matOrigen.delete();
      matDestino.delete();
      transformacion.delete();
      resultado.delete();
    }
  } finally {
    src.delete();
    chico.delete();
    if (cuadrilatero) cuadrilatero.delete();
  }
}
