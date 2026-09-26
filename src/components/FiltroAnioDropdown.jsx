import SelectDropdown from "./SelectDropdown";
import { ANIOS_CURSADA, labelAnio } from "../utils/anioCursada";

// Filtro de año de cursada, construido sobre SelectDropdown. `opciones` por
// defecto son los 6 años de la carrera; se puede pasar una lista más corta
// (ej. solo los años que ya tienen materias cargadas).
export default function FiltroAnioDropdown({ value, onChange, disabled = false, opciones = ANIOS_CURSADA, className = "" }) {
  return (
    <SelectDropdown
      className={className}
      value={value}
      onChange={onChange}
      disabled={disabled}
      icono="fa-calendar-days"
      opciones={[
        { value: "", label: "Todos los años", separadorDespues: opciones.length > 0 },
        ...opciones.map((anio) => ({ value: String(anio), label: labelAnio(anio) })),
      ]}
    />
  );
}
