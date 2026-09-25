// "Año" en MiResumenApp es el año de cursada de la carrera (1ro a 6to),
// no el año calendario. Este helper centraliza esa lista y su formato,
// para no repetir "1er/2do/3er..." en cada componente.
const ORDINALES = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to", 6: "6to" };

export const ANIOS_CURSADA = [1, 2, 3, 4, 5, 6];

export function labelAnio(anio) {
  return ORDINALES[anio] ? `${ORDINALES[anio]} Año` : `Año ${anio}`;
}
