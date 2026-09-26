import { Fragment } from "react";
import { Dropdown } from "react-bootstrap";

// Reemplazo estilado de un <select> nativo (Form.Select), consistente en
// toda la app: píldora + menú prolijo con el ítem activo resaltado. El
// <select> del navegador casi no se puede estilar al desplegarse, por eso
// en los formularios y filtros se arma este Dropdown propio en su lugar.
//
// `opciones`: [{ value, label, separadorDespues? }] — value siempre string.
// Para un filtro con "Todas/Todos", poné esa opción primero con value=""
// y separadorDespues=true (separa visualmente el "sin filtro" del resto).
export default function SelectDropdown({
  value,
  onChange,
  opciones,
  disabled = false,
  variant = "outline-info",
  activeVariant = "info",
  size,
  icono,
  className = "",
}) {
  const valorActual = value ?? "";
  const seleccionada = opciones.find((o) => o.value === valorActual) ?? opciones[0];

  return (
    <Dropdown className={className}>
      <Dropdown.Toggle
        variant={valorActual ? activeVariant : variant}
        size={size}
        disabled={disabled}
        className="rounded-pill select-dropdown-toggle"
      >
        {icono && <i className={`fa-solid ${icono} me-1`} aria-hidden="true" />}
        {seleccionada?.label}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {opciones.map((o) => (
          <Fragment key={o.value}>
            <Dropdown.Item active={o.value === valorActual} onClick={() => onChange(o.value)}>
              {o.label}
            </Dropdown.Item>
            {o.separadorDespues && <Dropdown.Divider />}
          </Fragment>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
