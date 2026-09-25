import { createContext, useContext, useReducer, useCallback, useState } from "react";
import { materiasIniciales, generarId } from "../data/mockData";

const MateriasContext = createContext(null);

function tableroVacio() {
  return { documentos: [], enEdicion: [], listo: [] };
}

// Cambia la extensión de un nombre de archivo ("Resumen.docx" -> "Resumen.pdf").
function reemplazarExtension(nombre, nuevaExtension) {
  const base = nombre.includes(".") ? nombre.slice(0, nombre.lastIndexOf(".")) : nombre;
  return `${base}.${nuevaExtension}`;
}

// Clave única de una hoja (Cátedra o Comisión), para comparar/deduplicar refs.
export function refHojaKey(ref) {
  return `${ref.materiaId}-${ref.catedraId}-${ref.comisionId ?? "x"}`;
}

// Encuentra y reemplaza la "hoja" (Cátedra sin Comisiones, o una Comisión puntual)
// dentro del árbol de materias, aplicando `updater` sobre una copia de esa hoja.
// Esto evita repetir la navegación materia -> catedra -> comision en cada acción.
function actualizarHoja(materias, { materiaId, catedraId, comisionId }, updater) {
  return materias.map((materia) => {
    if (materia.id !== materiaId) return materia;

    return {
      ...materia,
      catedras: materia.catedras.map((catedra) => {
        if (catedra.id !== catedraId) return catedra;

        if (comisionId == null) {
          // La hoja es la propia Cátedra
          return { ...catedra, ...updater(catedra) };
        }

        // La hoja es una Comisión dentro de esta Cátedra
        return {
          ...catedra,
          comisiones: catedra.comisiones.map((comision) =>
            comision.id === comisionId ? { ...comision, ...updater(comision) } : comision
          ),
        };
      }),
    };
  });
}

function reducer(materias, action) {
  switch (action.type) {
    case "CREAR_MATERIA": {
      const { id, nombre, anio, cuatrimestre, descripcion } = action.payload;
      const nueva = { id, nombre, anio, cuatrimestre, descripcion, catedras: [] };
      return [...materias, nueva];
    }

    case "CREAR_CATEDRA": {
      const { materiaId, id, nombre, profesor } = action.payload;
      return materias.map((materia) =>
        materia.id !== materiaId
          ? materia
          : {
              ...materia,
              catedras: [
                ...materia.catedras,
                { id, nombre, profesor, vecesCompartido: 0, tablero: tableroVacio(), comisiones: [] },
              ],
            }
      );
    }

    case "CREAR_COMISION": {
      const { materiaId, catedraId, id, nombre, turno } = action.payload;
      return materias.map((materia) =>
        materia.id !== materiaId
          ? materia
          : {
              ...materia,
              catedras: materia.catedras.map((catedra) =>
                catedra.id !== catedraId
                  ? catedra
                  : {
                      ...catedra,
                      comisiones: [
                        ...catedra.comisiones,
                        { id, nombre, turno, vecesCompartido: 0, tablero: tableroVacio() },
                      ],
                    }
              ),
            }
      );
    }

    case "SUBIR_ARCHIVOS": {
      const { ref, columna, archivos } = action.payload;
      return actualizarHoja(materias, ref, (hoja) => ({
        tablero: { ...hoja.tablero, [columna]: [...hoja.tablero[columna], ...archivos] },
      }));
    }

    case "MOVER_ARCHIVO": {
      const { ref, archivoId, columnaOrigen, columnaDestino } = action.payload;
      if (columnaOrigen === columnaDestino) return materias;

      return actualizarHoja(materias, ref, (hoja) => {
        const archivo = hoja.tablero[columnaOrigen].find((a) => a.id === archivoId);
        if (!archivo) return {};

        // Regla especial: pasar un archivo a "Listo para compartir" nunca lo
        // saca de su columna de origen, lo COPIA. Si es Word (doc/docx), la
        // copia queda "convertida" a PDF (simulado: cambia nombre/extensión,
        // sin un archivo real detrás — por eso pierde `archivoOriginal` y no
        // se puede descargar). Si ya es PDF, la copia es idéntica al original.
        if (columnaDestino === "listo") {
          const esWord = ["doc", "docx"].includes(archivo.extension?.toLowerCase());
          const copia = esWord
            ? {
                ...archivo,
                id: generarId(),
                nombre: reemplazarExtension(archivo.nombre, "pdf"),
                extension: "pdf",
                archivoOriginal: null,
                fechaActualizado: new Date().toISOString().slice(0, 10),
              }
            : { ...archivo, id: generarId(), fechaActualizado: new Date().toISOString().slice(0, 10) };

          return { tablero: { ...hoja.tablero, listo: [...hoja.tablero.listo, copia] } };
        }

        return {
          tablero: {
            ...hoja.tablero,
            [columnaOrigen]: hoja.tablero[columnaOrigen].filter((a) => a.id !== archivoId),
            [columnaDestino]: [...hoja.tablero[columnaDestino], archivo],
          },
        };
      });
    }

    case "ELIMINAR_ARCHIVO": {
      const { ref, columna, archivoId } = action.payload;
      return actualizarHoja(materias, ref, (hoja) => ({
        tablero: { ...hoja.tablero, [columna]: hoja.tablero[columna].filter((a) => a.id !== archivoId) },
      }));
    }

    case "COMPARTIR": {
      const { ref } = action.payload;
      return actualizarHoja(materias, ref, (hoja) => ({ vecesCompartido: hoja.vecesCompartido + 1 }));
    }

    case "EDITAR_MATERIA": {
      const { materiaId, nombre } = action.payload;
      return materias.map((materia) => (materia.id !== materiaId ? materia : { ...materia, nombre }));
    }

    case "EDITAR_CATEDRA": {
      const { materiaId, catedraId, nombre } = action.payload;
      return materias.map((materia) =>
        materia.id !== materiaId
          ? materia
          : {
              ...materia,
              catedras: materia.catedras.map((catedra) =>
                catedra.id !== catedraId ? catedra : { ...catedra, nombre }
              ),
            }
      );
    }

    default:
      return materias;
  }
}

export function MateriasProvider({ children }) {
  const [materias, dispatch] = useReducer(reducer, materiasIniciales);
  // Cola de envío: lista de refs de hojas "preparadas" para compartir en tanda.
  // Vive aparte del reducer de materias porque es una selección temporal de UI,
  // no un dato del dominio (no se guarda como parte de ninguna materia).
  const [colaEnvio, setColaEnvio] = useState([]);

  // Las 3 acciones de creación generan el id ANTES de despachar y lo devuelven:
  // así el componente que las llama (ej. "Seguir preparando" con 0 cátedras)
  // puede navegar de inmediato a la ruta del elemento recién creado.
  const crearMateria = useCallback((datos) => {
    const id = generarId();
    dispatch({ type: "CREAR_MATERIA", payload: { id, ...datos } });
    return id;
  }, []);
  const crearCatedra = useCallback((materiaId, datos) => {
    const id = generarId();
    dispatch({ type: "CREAR_CATEDRA", payload: { materiaId, id, ...datos } });
    return id;
  }, []);
  const crearComision = useCallback((materiaId, catedraId, datos) => {
    const id = generarId();
    dispatch({ type: "CREAR_COMISION", payload: { materiaId, catedraId, id, ...datos } });
    return id;
  }, []);
  const subirArchivos = useCallback(
    (ref, columna, archivos) => dispatch({ type: "SUBIR_ARCHIVOS", payload: { ref, columna, archivos } }),
    []
  );
  const moverArchivo = useCallback(
    (ref, archivoId, columnaOrigen, columnaDestino) =>
      dispatch({ type: "MOVER_ARCHIVO", payload: { ref, archivoId, columnaOrigen, columnaDestino } }),
    []
  );
  const compartir = useCallback((ref) => dispatch({ type: "COMPARTIR", payload: { ref } }), []);
  const editarMateria = useCallback(
    (materiaId, nombre) => dispatch({ type: "EDITAR_MATERIA", payload: { materiaId, nombre } }),
    []
  );
  const editarCatedra = useCallback(
    (materiaId, catedraId, nombre) => dispatch({ type: "EDITAR_CATEDRA", payload: { materiaId, catedraId, nombre } }),
    []
  );
  const eliminarArchivo = useCallback(
    (ref, columna, archivoId) => dispatch({ type: "ELIMINAR_ARCHIVO", payload: { ref, columna, archivoId } }),
    []
  );

  const agregarAColaEnvio = useCallback((ref) => {
    setColaEnvio((prev) => (prev.some((r) => refHojaKey(r) === refHojaKey(ref)) ? prev : [...prev, ref]));
  }, []);
  const quitarDeColaEnvio = useCallback((ref) => {
    setColaEnvio((prev) => prev.filter((r) => refHojaKey(r) !== refHojaKey(ref)));
  }, []);
  const vaciarColaEnvio = useCallback(() => setColaEnvio([]), []);
  // "Compartir todo": comparte cada resumen seleccionado (mismo efecto que tocar
  // "Compartir" en cada uno, uno por uno) y después vacía la cola.
  const compartirCola = useCallback(() => {
    colaEnvio.forEach((ref) => dispatch({ type: "COMPARTIR", payload: { ref } }));
    setColaEnvio([]);
  }, [colaEnvio]);

  const value = {
    materias,
    crearMateria,
    crearCatedra,
    crearComision,
    subirArchivos,
    moverArchivo,
    eliminarArchivo,
    compartir,
    editarMateria,
    editarCatedra,
    colaEnvio,
    agregarAColaEnvio,
    quitarDeColaEnvio,
    vaciarColaEnvio,
    compartirCola,
  };

  return <MateriasContext.Provider value={value}>{children}</MateriasContext.Provider>;
}

export function useMaterias() {
  const ctx = useContext(MateriasContext);
  if (!ctx) throw new Error("useMaterias debe usarse dentro de <MateriasProvider>");
  return ctx;
}

// Devuelve la Cátedra o Comisión "hoja" identificada por ref = {materiaId, catedraId, comisionId?}.
// Si comisionId es null/undefined, la hoja es la propia Cátedra.
export function getHoja(materias, { materiaId, catedraId, comisionId }) {
  const materia = materias.find((m) => m.id === materiaId);
  const catedra = materia?.catedras.find((c) => c.id === catedraId);
  if (comisionId == null) return catedra;
  return catedra?.comisiones.find((co) => co.id === comisionId);
}

// Total de "secciones" activas de una materia: cátedras sin comisiones + comisiones.
export function contarSecciones(materia) {
  return materia.catedras.reduce((total, catedra) => {
    return total + (catedra.comisiones.length > 0 ? catedra.comisiones.length : 1);
  }, 0);
}

// Suma de "veces compartido" de TODAS las hojas de una materia (cátedras sin
// comisiones + comisiones), para mostrar un contador general en el modal.
export function contarComparticionesTotales(materia) {
  return materia.catedras.reduce((total, catedra) => {
    if (catedra.comisiones.length > 0) {
      return total + catedra.comisiones.reduce((sub, comision) => sub + comision.vecesCompartido, 0);
    }
    return total + catedra.vecesCompartido;
  }, 0);
}
