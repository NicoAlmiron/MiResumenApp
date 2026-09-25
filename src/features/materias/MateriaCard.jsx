import { Card, Badge } from "react-bootstrap";
import { contarSecciones } from "../../context/MateriasContext";
import { labelAnio } from "../../utils/anioCursada";

// Tarjeta de una Materia en el grid de la pestaña Resúmenes.
export default function MateriaCard({ materia, onClick }) {
  const secciones = contarSecciones(materia);

  return (
    <Card role="button" onClick={onClick} className="h-100 materia-card">
      <Card.Body className="d-flex flex-column gap-2">
        <Card.Title className="mb-0">{materia.nombre}</Card.Title>
        <div className="text-body-secondary small">
          {materia.cuatrimestre ? `${materia.cuatrimestre} · ${labelAnio(materia.anio)}` : labelAnio(materia.anio)}
        </div>
        {materia.descripcion && (
          <Card.Text className="text-body-secondary small mb-0 line-clamp-2">{materia.descripcion}</Card.Text>
        )}
        <div className="mt-auto pt-2">
          <Badge bg={secciones > 0 ? "primary" : "secondary"} pill>
            {secciones > 0 ? `${secciones} ${secciones === 1 ? "sección" : "secciones"}` : "Sin secciones aún"}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}
