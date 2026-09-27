import { useState } from "react";
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
  // Archivos que se están subiendo de verdad a Drive ahora mismo (puede
  // tardar unos segundos) — viven acá, no en el Context, porque son estado
  // transitorio de esta pantalla, no datos del dominio.
  const [subiendo, setSubiendo] = useState([]); // [{ id, nombre, columnaKey }]

  function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return; // se soltó fuera de cualquier columna
    if (source.droppableId === destination.droppableId) return; // reordenar dentro de la misma columna: no-op por ahora
    moverArchivo(refHoja, Number(draggableId), source.droppableId, destination.droppableId);
  }

  // Se mandan los File reales: el backend los sube a Drive y genera
  // id/extensión a partir de ahí. Mientras tanto, se muestran tarjetas
  // fantasma con spinner (ver ArchivoCardSubiendo) hasta que se resuelva.
  async function handleSubir(columnaKey, fileList) {
    const archivos = Array.from(fileList);
    const pendientes = archivos.map((archivo) => ({ id: crypto.randomUUID(), nombre: archivo.name, columnaKey }));
    setSubiendo((prev) => [...prev, ...pendientes]);
    try {
      await subirArchivos(refHoja, columnaKey, archivos);
    } finally {
      setSubiendo((prev) => prev.filter((p) => !pendientes.includes(p)));
    }
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
              archivosSubiendo={subiendo.filter((p) => p.columnaKey === columna.key)}
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
