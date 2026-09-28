import { Card, Badge } from "react-bootstrap";

// Tarjeta de un usuario "boss" en la pestaña Resúmenes de un administrador
// (que ya no tiene Materias propias, es puramente supervisor) — mismo
// estilo que MateriaCard, entrar acá lleva al detalle de solo lectura de
// las Materias de ese boss.
export default function BossCard({ usuarioBoss, onClick }) {
  return (
    <Card role="button" onClick={onClick} className="h-100 tarjeta-clickeable">
      <Card.Body className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-person-circle fs-3 text-info" aria-hidden="true" />
          <Card.Title className="mb-0">{usuarioBoss.nombreUsuario}</Card.Title>
        </div>
        <div className="mt-auto pt-2">
          <Badge bg="info-subtle" text="info-emphasis" pill>
            Ver Materias
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}
