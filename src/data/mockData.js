// Datos de ejemplo en memoria. Cuando conectemos la API real, este archivo
// deja de usarse y MateriasContext va a pedir estos mismos datos por fetch.

let nextId = 1000; // contador simple para generar ids nuevos desde la UI

export function generarId() {
  nextId += 1;
  return nextId;
}

function tableroVacio() {
  return { documentos: [], enEdicion: [], listo: [] };
}

export const materiasIniciales = [
  {
    id: 1,
    nombre: "Derecho Civil I",
    anio: 1, // año de cursada (1ro a 6to), no año calendario
    cuatrimestre: "1er cuatrimestre",
    descripcion: "Parte general, personas y hechos y actos jurídicos.",
    catedras: [
      {
        id: 1,
        nombre: "Cátedra A",
        profesor: "Prof. Gómez",
        vecesCompartido: 3,
        tablero: {
          documentos: [
            { id: 1, nombre: "Manual Rivera - Parte General.pdf", extension: "pdf", fechaActualizado: "2026-09-10" },
          ],
          enEdicion: [
            { id: 2, nombre: "Resumen hechos y actos jurídicos.docx", extension: "docx", fechaActualizado: "2026-09-18" },
          ],
          listo: [
            { id: 3, nombre: "Temario final Civil I.pdf", extension: "pdf", fechaActualizado: "2026-09-20" },
          ],
        },
        comisiones: [],
      },
      {
        id: 2,
        nombre: "Cátedra B",
        profesor: "Prof. Fernández",
        vecesCompartido: 0,
        tablero: tableroVacio(),
        comisiones: [
          {
            id: 1,
            nombre: "Comisión 1",
            turno: "Mañana",
            vecesCompartido: 0,
            tablero: tableroVacio(),
          },
          {
            id: 2,
            nombre: "Comisión 2",
            turno: "Noche",
            vecesCompartido: 1,
            tablero: {
              documentos: [],
              enEdicion: [],
              listo: [
                { id: 4, nombre: "Resumen completo Comisión 2.pdf", extension: "pdf", fechaActualizado: "2026-09-15" },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 2,
    nombre: "Derecho Penal I",
    anio: 2,
    cuatrimestre: "2do cuatrimestre",
    descripcion: "",
    catedras: [],
  },
  {
    id: 3,
    nombre: "Filosofía del Derecho",
    anio: 2,
    cuatrimestre: "1er cuatrimestre",
    descripcion: "",
    catedras: [],
  },
];
