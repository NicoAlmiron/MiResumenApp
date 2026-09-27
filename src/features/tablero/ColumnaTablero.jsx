import { useRef } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button, Badge } from "react-bootstrap";
import ArchivoCard from "./ArchivoCard";
import ArchivoCardSubiendo from "./ArchivoCardSubiendo";
import { useFileDrop } from "../../hooks/useFileDrop";

// Una columna del Kanban. `permiteSubir` habilita el botón "Subir documentos"
// (cuando está vacía) y el drag-and-drop de archivos del sistema operativo
// (en cualquier momento, no solo vacía) — eso es RF-06/RF-07 del doc de requisitos.
// `archivosSubiendo` son nombres todavía en vuelo (POST sin confirmar) — se
// muestran como tarjetas fantasma con spinner, no son Draggable todavía.
export default function ColumnaTablero({
  columnaKey,
  titulo,
  archivos,
  archivosSubiendo = [],
  permiteSubir,
  onSubirArchivos,
  onMoverSiguiente,
  hayColumnaSiguiente,
  onEliminar,
}) {
  const inputRef = useRef(null);
  const { arrastrando, dropHandlers, onInputChange } = useFileDrop(onSubirArchivos);

  return (
    <div className={`kanban-columna ${arrastrando ? "kanban-columna--arrastrando" : ""}`} {...(permiteSubir ? dropHandlers : {})}>
      <div className="kanban-columna__header">
        <h3 className="h6 mb-0">{titulo}</h3>
        <Badge bg="secondary" pill>
          {archivos.length}
        </Badge>
      </div>

      <Droppable droppableId={columnaKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban-columna__body ${snapshot.isDraggingOver ? "kanban-columna__body--over" : ""}`}
          >
            {archivos.length === 0 && archivosSubiendo.length === 0 && permiteSubir && (
              <Button
                variant="outline-info"
                size="sm"
                className="w-100 rounded-pill py-2"
                onClick={() => inputRef.current?.click()}
              >
                <i className="bi bi-cloud-arrow-up-fill me-1" aria-hidden="true" />
                Subir documentos
              </Button>
            )}
            {archivos.length === 0 && archivosSubiendo.length === 0 && !permiteSubir && (
              <p className="text-body-secondary small text-center mb-0">
                <i className="bi bi-inbox d-block fs-4 mb-1" aria-hidden="true" />
                Arrastrá acá los archivos listos.
              </p>
            )}

            {archivos.map((archivo, index) => (
              <Draggable key={archivo.id} draggableId={String(archivo.id)} index={index}>
                {(providedDrag, snapshotDrag) => (
                  <div ref={providedDrag.innerRef} {...providedDrag.draggableProps} {...providedDrag.dragHandleProps}>
                    <ArchivoCard
                      archivo={archivo}
                      dragging={snapshotDrag.isDragging}
                      onMoverSiguiente={hayColumnaSiguiente ? () => onMoverSiguiente(archivo.id) : null}
                      onEliminar={() => onEliminar(archivo.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {archivosSubiendo.map((pendiente) => (
              <ArchivoCardSubiendo key={pendiente.id} nombre={pendiente.nombre} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {permiteSubir && (
        <>
          <input ref={inputRef} type="file" multiple hidden onChange={onInputChange} />
          {archivos.length > 0 && (
            <Button
              variant="outline-info"
              size="sm"
              className="mt-2 w-100 rounded-pill btn-agregar-mas"
              onClick={() => inputRef.current?.click()}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Agregar más archivos
            </Button>
          )}
        </>
      )}
    </div>
  );
}
