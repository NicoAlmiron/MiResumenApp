import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Lista reordenable genérica: mismo patrón visual/técnico que el Kanban del
// Tablero (@hello-pangea/dnd + mini-botón eliminar), reutilizado acá para
// fijar el orden final antes de unir los PDF. `items` = [{id, nombre, detalle}].
export default function ListaArchivosOrdenable({ items, onReordenar, onEliminar }) {
  function handleDragEnd(result) {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const copia = Array.from(items);
    const [movido] = copia.splice(source.index, 1);
    copia.splice(destination.index, 0, movido);
    onReordenar(copia);
  }

  if (items.length === 0) {
    return <p className="text-body-secondary small mb-0">Todavía no agregaste ningún archivo.</p>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="lista-archivos-ordenable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="d-flex flex-column gap-2">
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                {(providedDrag, snapshotDrag) => (
                  <div
                    ref={providedDrag.innerRef}
                    {...providedDrag.draggableProps}
                    className={`lista-ordenable__item ${snapshotDrag.isDragging ? "lista-ordenable__item--dragging" : ""}`}
                  >
                    <span className="lista-ordenable__numero">{index + 1}</span>
                    <span
                      {...providedDrag.dragHandleProps}
                      className="lista-ordenable__handle"
                      title="Arrastrar para reordenar"
                    >
                      <i className="bi bi-grip-vertical" aria-hidden="true" />
                    </span>
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-5" aria-hidden="true" />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="small fw-semibold text-truncate" title={item.nombre}>
                        {item.nombre}
                      </div>
                      {item.detalle && (
                        <div className="text-body-secondary" style={{ fontSize: "0.75rem" }}>
                          {item.detalle}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mini-badge-btn mini-badge-btn--eliminar"
                      title="Quitar"
                      onClick={() => onEliminar(item.id)}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
