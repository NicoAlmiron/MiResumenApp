import { createWorker } from "tesseract.js";

// OCR 100% en el navegador (Tesseract.js, WASM + Web Worker) — el modelo de
// español se descarga solo la primera vez que se usa (tesseract.js lo
// cachea en el navegador después), no infla el bundle de la app.
//
// Un solo worker para todo el lote de `blobs` (ya preprocesados por quien
// llama — ver construirPdfConOcr en imagenesAPdf.js, que aplica el mismo
// filtro blanco-y-negro-y-contraste que ya existe, porque mejora la
// precisión del OCR). Crear un worker carga el modelo de idioma, que tarda
// — repetirlo por imagen sería un desperdicio grande.
// `onProgreso({ indice, total, fraccion })` se llama durante el
// reconocimiento de cada imagen, para mostrar avance en la UI.
export async function reconocerTextoDeLote(blobs, onProgreso) {
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
