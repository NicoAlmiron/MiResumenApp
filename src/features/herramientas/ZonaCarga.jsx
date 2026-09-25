import { useRef } from "react";
import { Button } from "react-bootstrap";
import { useFileDrop } from "../../hooks/useFileDrop";

// Botón + drag-and-drop desde el explorador del SO, mismo patrón que ya usa
// el Tablero para subir archivos (ver ColumnaTablero.jsx / useFileDrop).
export default function ZonaCarga({ accept, multiple = false, onArchivos, texto = "Subir archivos", ayuda }) {
  const inputRef = useRef(null);
  const { arrastrando, dropHandlers, onInputChange } = useFileDrop(onArchivos);

  return (
    <div className={`zona-carga ${arrastrando ? "zona-carga--arrastrando" : ""}`} {...dropHandlers}>
      <i className="bi bi-cloud-arrow-up-fill fs-2 mb-2 d-block" aria-hidden="true" />
      <Button variant="outline-info" size="sm" className="rounded-pill" onClick={() => inputRef.current?.click()}>
        {texto}
      </Button>
      {ayuda && <p className="text-body-secondary small mt-2 mb-0">{ayuda}</p>}
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={onInputChange} />
    </div>
  );
}
