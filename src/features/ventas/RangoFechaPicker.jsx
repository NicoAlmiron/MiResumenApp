import { forwardRef } from "react";
import DatePicker from "react-datepicker";

// Los filtros guardan fechas como string "YYYY-MM-DD" (mismo formato que
// pedido.fecha, así el filtrado sigue comparando strings sin tocar nada
// más). Estas dos funciones son la única traducción hacia/desde Date, que
// es lo que pide react-datepicker.
function isoADate(iso) {
  if (!iso) return null;
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function dateAIso(date) {
  if (!date) return "";
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatoDDMMAAAA(iso) {
  if (!iso) return "dd/mm/aaaa";
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Botón que dispara el calendario, con pinta de UN solo campo de formulario
// ("Desde ... – Hasta ...") en vez de dos inputs de fecha separados.
const BotonRango = forwardRef(({ desde, hasta, onClick }, ref) => (
  <button type="button" className="rango-fecha-input" onClick={onClick} ref={ref}>
    <span className="rango-fecha-input__campo">
      <span className="rango-fecha-input__etiqueta">Desde</span>
      {formatoDDMMAAAA(desde)}
    </span>
    <span className="rango-fecha-input__separador">–</span>
    <span className="rango-fecha-input__campo">
      <span className="rango-fecha-input__etiqueta">Hasta</span>
      {formatoDDMMAAAA(hasta)}
    </span>
    <i className="bi bi-calendar3 rango-fecha-input__icono" aria-hidden="true" />
  </button>
));
BotonRango.displayName = "BotonRango";

// Selector de rango en UN solo calendario (selectsRange de react-datepicker):
// el primer click marca el "desde", el segundo el "hasta", todo en el mismo
// popup — no dos calendarios separados como con dos <input type="date">.
export default function RangoFechaPicker({ desde, hasta, onCambiar }) {
  return (
    <DatePicker
      selectsRange
      startDate={isoADate(desde)}
      endDate={isoADate(hasta)}
      onChange={([nuevoDesde, nuevoHasta]) =>
        onCambiar({ fechaDesde: dateAIso(nuevoDesde), fechaHasta: dateAIso(nuevoHasta) })
      }
      isClearable
      dateFormat="dd/MM/yyyy"
      calendarStartDay={1}
      popperPlacement="bottom-start"
      customInput={<BotonRango desde={desde} hasta={hasta} />}
    />
  );
}
