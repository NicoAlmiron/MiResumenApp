// tesseract.js pesa bastante (WASM + glue) — import() dinámico a propósito,
// igual que @techstark/opencv-js (ver opencv.js), para que ese peso se baje
// recién la primera vez que hace falta (Word + OCR activado), no apenas se
// entra a la página — antes se importaba estático y se cargaba siempre,
// aunque no se usara.
//
// Un solo worker para todo el lote de `blobs` (ya preprocesados por quien
// llama — ver construirPdfConOcr en imagenesAPdf.js, que aplica el mismo
// filtro blanco-y-negro-y-contraste que ya existe, porque mejora la
// precisión del OCR). Crear un worker carga el modelo de idioma, que tarda
// — repetirlo por imagen sería un desperdicio grande.
// `onProgreso({ indice, total, fraccion })` se llama durante el
// reconocimiento de cada imagen, para mostrar avance en la UI.
export async function reconocerTextoDeLote(blobs, onProgreso) {
  const { createWorker } = await import("tesseract.js");
  let indiceActual = 0;
  const worker = await createWorker("spa", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgreso) {
        onProgreso({ indice: indiceActual, total: blobs.length, fraccion: m.progress });
      }
    },
  });
  try {
    const textos = [];
    for (let i = 0; i < blobs.length; i++) {
      indiceActual = i;
      const { data } = await worker.recognize(blobs[i]);
      textos.push(data.text.trim());
    }
    return textos;
  } finally {
    await worker.terminate();
  }
}
