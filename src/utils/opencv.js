// @techstark/opencv-js pesa varios MB (el WASM de OpenCV) — import() dinámico
// a propósito, para que ese peso se baje recién la primera vez que hace
// falta (recorte automático o filtro tipo escáner), no apenas se entra a la
// página. Mismo espíritu que el modelo de español de Tesseract.js (ver
// ocrTexto.js), que también se baja solo al usarse. Compartido entre
// autoRecorte.js e imagenesAPdf.js para no duplicar la inicialización.
//
// opencv-js expone distintos patrones de inicialización según cómo termine
// de cargar el WASM — este es el patrón recomendado por la librería (ver su
// README), cacheado para no repetir la espera en cada llamada.
let cvListo = null;
export function obtenerCv() {
  if (!cvListo) {
    cvListo = (async () => {
      const { default: cvModule } = await import("@techstark/opencv-js");
      if (cvModule instanceof Promise) return await cvModule;
      if (cvModule.Mat) return cvModule;
      await new Promise((resolve) => {
        cvModule.onRuntimeInitialized = resolve;
      });
      return cvModule;
    })();
  }
  return cvListo;
}
