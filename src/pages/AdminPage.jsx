import { Container, Tabs, Tab } from "react-bootstrap";
import MateriasAdminTab from "../features/admin/MateriasAdminTab";
import CatedrasAdminTab from "../features/admin/CatedrasAdminTab";
import ComisionesAdminTab from "../features/admin/ComisionesAdminTab";
import UsuariosAdminTab from "../features/admin/UsuariosAdminTab";
import PedidosAdminTab from "../features/admin/PedidosAdminTab";

// Backoffice: solo para el rol "administrador" (ver RequireRol en App.jsx).
// Muestra y permite editar/eliminar todas las entidades del sistema.
export default function AdminPage() {
  return (
    <Container fluid className="py-4 px-3 px-md-4">
      <h4 className="mb-1">
        <i className="bi bi-speedometer2 me-2 text-info" aria-hidden="true" />
        Administrador
      </h4>
      <p className="text-body-secondary mb-4">Todas las entidades del sistema, para mantenimiento.</p>

      <Tabs defaultActiveKey="materias" className="mb-3">
        <Tab eventKey="materias" title="Materias">
          <MateriasAdminTab />
        </Tab>
        <Tab eventKey="catedras" title="Cátedras">
          <CatedrasAdminTab />
        </Tab>
        <Tab eventKey="comisiones" title="Comisiones">
          <ComisionesAdminTab />
        </Tab>
        <Tab eventKey="usuarios" title="Usuarios">
          <UsuariosAdminTab />
        </Tab>
        <Tab eventKey="pedidos" title="Pedidos">
          <PedidosAdminTab />
        </Tab>
      </Tabs>
    </Container>
  );
}
