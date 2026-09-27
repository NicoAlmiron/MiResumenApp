import { DragDropContext } from "@hello-pangea/dnd";
import { useMaterias } from "../../context/MateriasContext";
import ColumnaTablero from "./ColumnaTablero";

const COLUMNAS = [
  { key: "documentos", titulo: "Documentos necesarios" },
  { key: "enEdicion", titulo: "Para modificaciones" },
  { key: "listo", titulo: "Listo para compartir" },
];

// Tablero Kanban de 3 columnas fijas de una hoja (Cátedra sin Comisiones, o
// Comisión). `hoja` es el objeto con `.tablero`, `refHoja` identifica a esa
// hoja dentro del Context para poder despachar acciones sobre ella.
export default function TableroKanban({ hoja, refHoja }) {
  const { moverArchivo, subirArchivos, eliminarArchivo } = useMaterias();

  function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return; // se soltó fuera de cualquier columna
    if (source.droppableId === destination.droppableId) return; // reordenar dentro de la misma columna: no-op por ahora
    moverArchivo(refHoja, Number(draggableId), source.droppableId, destination.droppableId);
  }

  // Se mandan los File reales: el backend los sube a Drive y genera
  // id/extensión a partir de ahí.
  function handleSubir(columnaKey, fileList) {
    subirArchivos(refHoja, columnaKey, Array.from(fileList));
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-tablero">
        {COLUMNAS.map((columna, index) => {
          const siguiente = COLUMNAS[index + 1]?.key ?? null;
          return (
            <ColumnaTablero
              key={columna.key}
              columnaKey={columna.key}
              titulo={columna.titulo}
              archivos={hoja.tablero[columna.key]}
              permiteSubir={columna.key !== "listo"}
              onSubirArchivos={(files) => handleSubir(columna.key, files)}
              hayColumnaSiguiente={siguiente != null}
              onMoverSiguiente={(archivoId) => moverArchivo(refHoja, archivoId, columna.key, siguiente)}
              onEliminar={(archivoId) => eliminarArchivo(refHoja, columna.key, archivoId)}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
