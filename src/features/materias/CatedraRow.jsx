import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useMaterias } from "../../context/MateriasContext";
import NombreEditable from "../../components/NombreEditable";
import SeccionButtons from "./SeccionButtons";
import ComisionRow from "./ComisionRow";
import CrearComisionModal from "./CrearComisionModal";

// Una fila de Cátedra dentro del modal de detalle de Materia.
// Regla de negocio (ver docs/Requisitos_Funcionales): el tablero/contador
// "vive" en la Comisión si la Cátedra tiene alguna; si no tiene ninguna,
// vive en la propia Cátedra. Por eso acá decidimos qué mostrar según
// catedra.comisiones.length.
export default function CatedraRow({ materiaId, catedra }) {
  const navigate = useNavigate();
  const { crearComision, editarCatedra } = useMaterias();
  const [showCrearComision, setShowCrearComision] = useState(false);

  const tieneComisiones = catedra.comisiones.length > 0;
  const estaListo = catedra.tablero.listo.length > 0;
  const ref = { materiaId, catedraId: catedra.id, comisionId: null };

  return (
    <div className="border border-secondary-subtle rounded-3 p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <NombreEditable
            value={catedra.nombre}
            onSave={(nuevoNombre) => editarCatedra(materiaId, catedra.id, nuevoNombre)}
            textClassName="fw-semibold"
          />
          {catedra.profesor && <div className="text-body-secondary small">{catedra.profesor}</div>}
        </div>
        <Button variant="outline-info" size="sm" onClick={() => setShowCrearComision(true)}>
          + Comisión
        </Button>
      </div>

      {!tieneComisiones && (
        <div className="mt-2">
          <SeccionButtons
            refHoja={ref}
            estaListo={estaListo}
            vecesCompartido={catedra.vecesCompartido}
            onSeguirPreparando={() => navigate(`/materias/${materiaId}/catedras/${catedra.id}/tablero`)}
          />
        </div>
      )}

      {tieneComisiones && (
        <div className="mt-3 d-flex flex-column gap-2">
          {catedra.comisiones.map((comision) => (
            <ComisionRow key={comision.id} materiaId={materiaId} catedraId={catedra.id} comision={comision} />
          ))}
        </div>
      )}

      <CrearComisionModal
        show={showCrearComision}
        onHide={() => setShowCrearComision(false)}
        catedraNombre={catedra.nombre}
        onCrear={(datos) => crearComision(materiaId, catedra.id, datos)}
      />
    </div>
  );
}
