import { useCallback, useState } from "react";

// Maneja tanto "arrastrar y soltar archivos desde el explorador de Windows"
// (eventos HTML5 nativos, sin librería) como el click en un botón que dispara
// un <input type="file"> oculto. Ambos caminos terminan llamando a
// `onArchivos(fileList)`. Genérico: lo usan el Tablero y las Herramientas.
export function useFileDrop(onArchivos) {
  const [arrastrando, setArrastrando] = useState(false);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setArrastrando(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setArrastrando(false);
      if (e.dataTransfer.files?.length) onArchivos(e.dataTransfer.files);
    },
    [onArchivos]
  );

  const onInputChange = useCallback(
    (e) => {
      if (e.target.files?.length) onArchivos(e.target.files);
      e.target.value = ""; // para poder volver a elegir el mismo archivo más tarde
    },
    [onArchivos]
  );

  return { arrastrando, dropHandlers: { onDragOver, onDragLeave, onDrop }, onInputChange };
}
