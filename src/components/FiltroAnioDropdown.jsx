import { Dropdown } from "react-bootstrap";
import { ANIOS_CURSADA, labelAnio } from "../utils/anioCursada";

// Filtro de año de cursada como Dropdown propio (en vez de un <select>
// nativo, que el navegador dibuja sin poder estilarlo casi nada al
// desplegarse). Mismo patrón que el dropdown de agrupaciones del footer.
// `opciones` por defecto son los 6 años de la carrera; se puede pasar una
// lista más corta (ej. solo los años que ya tienen materias cargadas).
export default function FiltroAnioDropdown({ value, onChange, disabled = false, opciones = ANIOS_CURSADA, className = "" }) {
  const hayFiltro = Boolean(value);

  return (
    <Dropdown className={className}>
      <Dropdown.Toggle
        variant={hayFiltro ? "info" : "outline-info"}
        className="rounded-pill filtro-anio-toggle"
        disabled={disabled}
      >
        <i className="fa-solid fa-calendar-days me-1" aria-hidden="true" />
        {hayFiltro ? labelAnio(Number(value)) : "Todos los años"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item active={!hayFiltro} onClick={() => onChange("")}>
          Todos los años
        </Dropdown.Item>
        <Dropdown.Divider />
        {opciones.map((anio) => (
          <Dropdown.Item key={anio} active={Number(value) === anio} onClick={() => onChange(String(anio))}>
            {labelAnio(anio)}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
