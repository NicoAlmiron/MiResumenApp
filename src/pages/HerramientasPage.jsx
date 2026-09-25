import { Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

// Catálogo de herramientas sueltas. Para sumar una nueva más adelante,
// alcanza con agregar una entrada acá (y la ruta correspondiente en App.jsx).
const HERRAMIENTAS = [
  {
    ruta: "unir-pdfs",
    icono: "bi-files",
    titulo: "Unir PDFs",
    descripcion: "Combiná varios PDF en uno solo, en el orden que elijas.",
  },
  {
    ruta: "pdf-a-word",
    icono: "bi-filetype-docx",
    titulo: "PDF a Word",
    descripcion: "Extrae el texto de un PDF y lo descarga como .docx.",
  },
  {
    ruta: "word-a-pdf",
    icono: "bi-filetype-pdf",
    titulo: "Word a PDF",
    descripcion: "Convierte un .docx a PDF, listo para compartir.",
  },
];

export default function HerramientasPage() {
  return (
    <Container className="py-4">
      <h4 className="mb-1">Herramientas</h4>
      <p className="text-body-secondary mb-4">
        Utilidades sueltas para armar tus resúmenes. Con el tiempo van a ir sumándose más.
      </p>

      <Row xs={1} sm={2} lg={3} className="g-3">
        {HERRAMIENTAS.map((h) => (
          <Col key={h.ruta}>
            <Card as={Link} to={h.ruta} className="h-100 tarjeta-clickeable text-decoration-none">
              <Card.Body className="d-flex flex-column gap-2">
                <i className={`bi ${h.icono} fs-1 text-info`} aria-hidden="true" />
                <Card.Title className="mb-0">{h.titulo}</Card.Title>
                <Card.Text className="text-body-secondary small mb-0">{h.descripcion}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
