import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge } from "react-bootstrap";
import { useMaterias, contarComparticionesTotales } from "../../context/MateriasContext";
import { labelAnio } from "../../utils/anioCursada";
import NombreEditable from "../../components/NombreEditable";
import CatedraRow from "./CatedraRow";
import CrearCatedraModal from "./CrearCatedraModal";
import SeccionButtons from "./SeccionButtons";

// Modal de detalle de una Materia: datos generales + sus Cátedras/Comisiones.
// Caso especial (RF-19/RF-20): si la Materia todavía no tiene ninguna Cátedra,
// se muestran directo los botones "Seguir editando"/"Compartir". Como el
// tablero real siempre cuelga de una Cátedra (o Comisión), al tocar "Seguir
// editando" acá se crea automáticamente una primera Cátedra ("General")
// y se navega a su tablero — el usuario no nota el paso intermedio.
export default function MateriaDetalleModal({ show, onHide, materia }) {
  const navigate = useNavigate();
  const { crearCatedra, editarMateria } = useMaterias();
  const [showCrearCatedra, setShowCrearCatedra] = useState(false);

  if (!materia) return null;
  const sinSecciones = materia.catedras.length === 0;
  const totalCompartidos = contarComparticionesTotales(materia);

  async function handleSeguirPreparandoSinSecciones() {
    const nuevaCatedraId = await crearCatedra(materia.id, { nombre: "General", profesor: "" });
    navigate(`/materias/${materia.id}/catedras/${nuevaCatedraId}/tablero`);
  }

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex flex-wrap align-items-center gap-2">
            <NombreEditable
              value={materia.nombre}
              onSave={(nuevoNombre) => editarMateria(materia.id, nuevoNombre)}
              textClassName="fs-5 fw-semibold"
            />
            {materia.anio && (
              <Badge bg="info-subtle" text="info-emphasis" className="align-middle">
                {materia.cuatrimestre ? `${materia.cuatrimestre} · ${labelAnio(materia.anio)}` : labelAnio(materia.anio)}
              </Badge>
            )}
            <Badge bg="dark" className="align-middle d-inline-flex align-items-center gap-1 border border-secondary-subtle">
              <i className="bi bi-share-fill" aria-hidden="true" />
              {totalCompartidos} en total
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column gap-3">
          {materia.descripcion && <p className="text-body-secondary mb-0">{materia.descripcion}</p>}

          {sinSecciones ? (
            <SeccionButtons
              refHoja={null}
              estaListo={false}
              vecesCompartido={0}
              onSeguirPreparando={handleSeguirPreparandoSinSecciones}
            />
          ) : (
            <div className="d-flex flex-column gap-2">
              {materia.catedras.map((catedra) => (
                <CatedraRow key={catedra.id} materiaId={materia.id} catedra={catedra} />
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" onClick={() => setShowCrearCatedra(true)}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Crear sección
          </Button>
        </Modal.Footer>
      </Modal>

      <CrearCatedraModal
        show={showCrearCatedra}
        onHide={() => setShowCrearCatedra(false)}
        materiaNombre={materia.nombre}
        onCrear={(datos) => crearCatedra(materia.id, datos)}
      />
    </>
  );
}
