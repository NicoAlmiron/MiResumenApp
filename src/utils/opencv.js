// @techstark/opencv-js pesa varios MB (el WASM de OpenCV) — import() dinámico
// a propósito, para que ese peso se baje recién la primera vez que hace
// falta (recorte automático o filtro tipo escáner), no apenas se entra a la
// página. Mismo espíritu que el modelo de español de Tesseract.js (ver
// ocrTexto.js), que también se baja solo al usarse. Compartido entre
// autoRecorte.js e imagenesAPdf.js para no duplicar la inicialización.
const INTENTOS = 3;
const ESPERA_ENTRE_INTENTOS_MS = 1500;

// opencv-js expone distintos patrones de inicialización según cómo termine
// de cargar el WASM — este es el patrón recomendado por la librería (ver su
// README).
async function cargarCv() {
  let ultimoError;
  for (let intento = 0; intento < INTENTOS; intento++) {
    // Una descarga de ~15MB puede fallar una vez en una conexión de celular
    // real y andar bien al segundo intento — no nos damos por vencidos con
    // el primer fallo.
    if (intento > 0) await new Promise((resolve) => setTimeout(resolve, ESPERA_ENTRE_INTENTOS_MS));
    try {
      const { default: cvModule } = await import("@techstark/opencv-js");
      if (cvModule instanceof Promise) return await cvModule;
      if (cvModule.Mat) return cvModule;
      await new Promise((resolve) => {
        cvModule.onRuntimeInitialized = resolve;
      });
      return cvModule;
    } catch (err) {
      ultimoError = err;
    }
  }
  throw ultimoError;
}

let cvListo = null;
export function obtenerCv() {
  if (!cvListo) {
    cvListo = cargarCv().catch((err) => {
      // No cachear un fallo para siempre: si falló por la red, un intento
      // más adelante (otra imagen del lote, o reintentar) puede andar.
      cvListo = null;
      throw err;
    });
  }
  return cvListo;
}
