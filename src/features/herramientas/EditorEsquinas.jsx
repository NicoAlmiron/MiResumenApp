import { useRef, useState } from "react";
import { Button } from "react-bootstrap";

const ESQUINAS_COMPLETAS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

// Editor de las 4 esquinas del recorte sobre la foto original. Las manijas
// se arrastran con Pointer Events (toque y mouse), y las posiciones quedan
// normalizadas 0–1 respecto de la foto, que es lo que espera el backend
// (ver /herramientas/recortar-manual).
export default function EditorEsquinas({ url, esquinasIniciales, onAplicar, onCancelar }) {
  const [proporcion, setProporcion] = useState(1);
  const [esquinas, setEsquinas] = useState(esquinasIniciales ?? ESQUINAS_COMPLETAS);
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef(null);

  function moverEsquina(indice, evento) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (evento.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (evento.clientY - rect.top) / rect.height));
    setEsquinas((actuales) => actuales.map((p, i) => (i === indice ? [x, y] : p)));
  }

  async function aplicar() {
    setEnviando(true);
    try {
      await onAplicar(esquinas);
    } finally {
      setEnviando(false);
    }
  }

  const puntos = esquinas.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div className="editor-esquinas">
      <div
        ref={areaRef}
        className="editor-esquinas__area"
        style={{ aspectRatio: `${proporcion}`, width: `min(100%, ${60 * proporcion}vh)` }}
      >
        <img
            src={url}
            alt=""
            className="editor-esquinas__imagen"
            draggable={false}
            onLoad={(e) => setProporcion(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          />
        <svg className="editor-esquinas__guia" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={puntos} />
        </svg>
        {esquinas.map(([x, y], i) => (
          <div
            key={i}
            role="slider"
            aria-label={`Esquina ${i + 1}`}
            className="editor-esquinas__manija"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) moverEsquina(i, e);
            }}
            onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
          />
        ))}
      </div>
      <div className="d-flex justify-content-end gap-2 mt-2">
        <Button variant="outline-secondary" size="sm" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button variant="info" size="sm" onClick={aplicar} disabled={enviando}>
          {enviando ? "Aplicando..." : "Aplicar recorte"}
        </Button>
      </div>
    </div>
  );
}
