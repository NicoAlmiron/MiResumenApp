import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button, Spinner } from "react-bootstrap";
import EditorEsquinas from "./EditorEsquinas";

// Lista reordenable de fotos para "Imágenes a PDF" — variante de
// ListaArchivosOrdenable.jsx (Unir PDFs) pensada para imágenes. Tocar (o
// hacer click en) una foto la despliega con una vista previa grande, dos
// chips para el recorte automático y el blanco y negro de ESA foto, y el
// botón para ajustar las 4 esquinas a mano. Tocar de nuevo la contrae.
// `items` = [{id, nombre, archivoOriginal, miniatura, procesando,
// recorteAplicado, filtro, esquinas}] — ver ImagenesAPdfPage.jsx.
export default function ListaImagenesOrdenable({
  items,
  onReordenar,
  onEliminar,
  onAlternarRecorte,
  onAlternarFiltro,
  onAplicarAjuste,
}) {
  const [abiertoId, setAbiertoId] = useState(null);
  const [ajustandoId, setAjustandoId] = useState(null);

  function alternarAbierto(id) {
    setAbiertoId((actual) => (actual === id ? null : id));
    setAjustandoId(null);
  }

  function handleDragEnd(result) {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const copia = Array.from(items);
    const [movido] = copia.splice(source.index, 1);
    copia.splice(destination.index, 0, movido);
    onReordenar(copia);
  }

  if (items.length === 0) {
    return <p className="text-body-secondary small mb-0">Todavía no agregaste ninguna foto.</p>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="lista-imagenes-ordenable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="d-flex flex-column gap-2">
            {items.map((item, index) => {
              const abierto = abiertoId === item.id;
              const ajustando = ajustandoId === item.id;
              const claseFiltro = item.filtro ? "lista-imagenes__img--filtro" : "";
              return (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(providedDrag, snapshotDrag) => (
                    <div
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                      className={`lista-imagenes__item ${snapshotDrag.isDragging ? "lista-imagenes__item--dragging" : ""}`}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="lista-ordenable__numero">{index + 1}</span>
                        <span
                          {...providedDrag.dragHandleProps}
                          className="lista-ordenable__handle"
                          title="Arrastrar para reordenar"
                        >
                          <i className="bi bi-grip-vertical" aria-hidden="true" />
                        </span>
                        <div
                          className="lista-imagenes__zona-preview d-flex align-items-center gap-2 flex-grow-1 overflow-hidden"
                          role="button"
                          tabIndex={0}
                          aria-expanded={abierto}
                          title={abierto ? "Contraer" : "Ver y ajustar"}
                          onClick={() => alternarAbierto(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              alternarAbierto(item.id);
                            }
                          }}
                        >
                          <img src={item.miniatura} alt="" className={`lista-imagenes__miniatura ${claseFiltro}`} />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="small fw-semibold text-truncate" title={item.nombre}>
                              {item.nombre}
                            </div>
                            {item.procesando ? (
                              <div className="text-info d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                                Recortando...
                              </div>
                            ) : (
                              <div className="d-flex gap-2">
                                <span
                                  className={`lista-imagenes__estado ${item.recorteAplicado ? "lista-imagenes__estado--activo" : ""}`}
                                >
                                  <i className="bi bi-crop" aria-hidden="true" /> Recorte
                                </span>
                                <span
                                  className={`lista-imagenes__estado ${item.filtro ? "lista-imagenes__estado--activo" : ""}`}
                                >
                                  <i className="bi bi-circle-half" aria-hidden="true" /> B/N
                                </span>
                              </div>
                            )}
                          </div>
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

                      {abierto && (
                        <div className="lista-imagenes__preview">
                          {ajustando ? (
                            <EditorEsquinas
                              url={item.urlOriginal}
                              esquinasIniciales={item.esquinas}
                              onCancelar={() => setAjustandoId(null)}
                              onAplicar={async (esquinas) => {
                                const aplicado = await onAplicarAjuste(item, esquinas);
                                if (aplicado) setAjustandoId(null);
                              }}
                            />
                          ) : (
                            <>
                              <img
                                src={item.miniatura}
                                alt=""
                                className={`lista-imagenes__preview-img ${claseFiltro}`}
                              />
                              <div className="lista-imagenes__editor">
                                <button
                                  type="button"
                                  className={`chip-toggle ${item.recorteAplicado ? "chip-toggle--activo" : ""}`}
                                  disabled={item.procesando}
                                  onClick={() => onAlternarRecorte(item)}
                                >
                                  <i className="bi bi-crop" aria-hidden="true" />
                                  Recorte automático
                                </button>
                                <button
                                  type="button"
                                  className={`chip-toggle ${item.filtro ? "chip-toggle--activo" : ""}`}
                                  onClick={() => onAlternarFiltro(item.id)}
                                >
                                  <i className="bi bi-circle-half" aria-hidden="true" />
                                  Blanco y negro
                                </button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="rounded-pill"
                                  disabled={item.procesando}
                                  onClick={() => setAjustandoId(item.id)}
                                >
                                  <i className="bi bi-arrows-move me-1" aria-hidden="true" />
                                  Ajustar recorte
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
