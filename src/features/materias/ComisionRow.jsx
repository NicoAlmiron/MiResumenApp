import { useNavigate } from "react-router-dom";
import SeccionButtons from "./SeccionButtons";

// Una fila de Comisión dentro de una Cátedra (dentro del modal de detalle de Materia).
export default function ComisionRow({ materiaId, catedraId, comision }) {
  const navigate = useNavigate();
  const estaListo = comision.tablero.listo.length > 0;
  const ref = { materiaId, catedraId, comisionId: comision.id };

  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 ps-3 py-2 border-start border-2 border-info-subtle">
      <div>
        <div className="fw-semibold">{comision.nombre}</div>
        {comision.turno && <div className="text-body-secondary small">Turno {comision.turno}</div>}
      </div>
      <SeccionButtons
        refHoja={ref}
        estaListo={estaListo}
        vecesCompartido={comision.vecesCompartido}
        archivos={comision.tablero.listo}
        onSeguirPreparando={() =>
          navigate(`/materias/${materiaId}/catedras/${catedraId}/comisiones/${comision.id}/tablero`)
        }
      />
    </div>
  );
}
