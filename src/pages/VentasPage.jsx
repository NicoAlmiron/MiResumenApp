import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useMaterias } from "../context/MateriasContext";
import UltimosPedidosLista from "../features/ventas/UltimosPedidosLista";
import PedidosFiltros, { FILTROS_VACIOS } from "../features/ventas/PedidosFiltros";
import PedidosTabla from "../features/ventas/PedidosTabla";
import PedidosTarjetas from "../features/ventas/PedidosTarjetas";

// Un pedido "coincide" si CUALQUIERA de sus resúmenes matchea materia/cátedra/
// comisión/año (un pedido con varios resúmenes puede tocar más de una), y si
// el contacto o la fecha entran dentro de lo pedido.
function pedidoCoincide(pedido, filtros) {
  if (filtros.busqueda) {
    const q = filtros.busqueda.trim().toLowerCase();
    const coincideTexto =
      pedido.contactoNombre.toLowerCase().includes(q) ||
      pedido.contactoTelefono.toLowerCase().includes(q) ||
      pedido.resumenes.some((r) => r.materiaNombre.toLowerCase().includes(q));
    if (!coincideTexto) return false;
  }
  if (filtros.materiaId && !pedido.resumenes.some((r) => r.materiaId === Number(filtros.materiaId))) return false;
  if (filtros.catedraId && !pedido.resumenes.some((r) => r.catedraId === Number(filtros.catedraId))) return false;
  if (filtros.comisionId && !pedido.resumenes.some((r) => r.comisionId === Number(filtros.comisionId))) return false;
  if (filtros.anio && !pedido.resumenes.some((r) => r.anio === Number(filtros.anio))) return false;
  if (filtros.fechaDesde && pedido.fecha < filtros.fechaDesde) return false;
  if (filtros.fechaHasta && pedido.fecha > filtros.fechaHasta) return false;
  return true;
}

export default function VentasPage() {
  const { materias, pedidos } = useMaterias();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const pedidosOrdenados = useMemo(
    () => [...pedidos].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id)),
    [pedidos]
  );

  const pedidosFiltrados = useMemo(
    () => pedidosOrdenados.filter((pedido) => pedidoCoincide(pedido, filtros)),
    [pedidosOrdenados, filtros]
  );

  return (
    <Container fluid className="py-4 px-3 px-md-4">
      <Row className="g-4">
        <Col md={8} lg={9}>
          <h5 className="mb-3">
            <i className="bi bi-receipt me-2" aria-hidden="true" />
            Pedidos
          </h5>
          <PedidosFiltros materias={materias} filtros={filtros} onFiltrosChange={setFiltros} />
          {/* Los mismos pedidos ya filtrados alimentan las dos vistas — en
              mobile la tabla no entra bien, así que se muestra como tarjetas. */}
          <div className="d-none d-md-block">
            <PedidosTabla pedidos={pedidosFiltrados} />
          </div>
          <div className="d-md-none">
            <PedidosTarjetas pedidos={pedidosFiltrados} />
          </div>
        </Col>

        <Col md={4} lg={3}>
          <h5 className="mb-3">
            <i className="bi bi-clock-history me-2" aria-hidden="true" />
            Últimos compartidos
          </h5>
          <UltimosPedidosLista pedidos={pedidosOrdenados} />
        </Col>
      </Row>
    </Container>
  );
}
