import { useState } from "react";
import { Form } from "react-bootstrap";

// Texto + lápiz que, al tocarlo, se convierte en un input editable con
// botones de guardar/cancelar (Enter guarda, Escape cancela). Se usa tanto
// para el nombre de la Materia como el de la Cátedra en el modal de detalle.
export default function NombreEditable({ value, onSave, textClassName = "" }) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(value);

  function iniciarEdicion() {
    setBorrador(value);
    setEditando(true);
  }

  function guardar() {
    const limpio = borrador.trim();
    if (limpio && limpio !== value) onSave(limpio);
    setEditando(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      guardar();
    }
    if (e.key === "Escape") {
      // sin esto, el Escape "sigue de largo" y cierra el modal entero
      // (react-bootstrap escucha Escape a nivel del Modal para cerrarlo).
      e.preventDefault();
      e.stopPropagation();
      setBorrador(value);
      setEditando(false);
    }
  }

  if (editando) {
    return (
      <span className="d-inline-flex align-items-center gap-1">
        <Form.Control
          autoFocus
          size="sm"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={guardar}
          style={{ maxWidth: 280 }}
        />
        <button type="button" className="btn btn-sm btn-success rounded-circle nombre-editable__accion" title="Guardar" onMouseDown={(e) => e.preventDefault()} onClick={guardar}>
          <i className="bi bi-check-lg" aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span className={textClassName}>{value}</span>
      <button
        type="button"
        className="btn btn-sm btn-link text-info-emphasis p-0 nombre-editable__lapiz"
        title="Editar nombre"
        onClick={iniciarEdicion}
      >
        <i className="bi bi-pencil" aria-hidden="true" />
      </button>
    </span>
  );
}
