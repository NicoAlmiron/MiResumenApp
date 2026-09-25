import { useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useMaterias } from "../context/MateriasContext";
import UltimosEnviosStrip from "../features/ventas/UltimosEnviosStrip";
import EnviosFiltros, { FILTROS_VACIOS } from "../features/ventas/EnviosFiltros";
import EnviosTabla from "../features/ventas/EnviosTabla";

export default function VentasPage() {
  const { materias, envios } = useMaterias();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const enviosOrdenados = useMemo(
    () => [...envios].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id)),
    [envios]
  );

  const enviosFiltrados = useMemo(() => {
    return enviosOrdenados.filter((envio) => {
      if (filtros.materiaId && envio.materiaId !== Number(filtros.materiaId)) return false;
      if (filtros.catedraId && envio.catedraId !== Number(filtros.catedraId)) return false;
      if (filtros.comisionId && envio.comisionId !== Number(filtros.comisionId)) return false;
      if (filtros.anio && envio.anio !== Number(filtros.anio)) return false;
      if (filtros.contacto) {
        const q = filtros.contacto.trim().toLowerCase();
        const coincide =
          envio.contactoNombre.toLowerCase().includes(q) || envio.contactoTelefono.toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [enviosOrdenados, filtros]);

  return (
    <Container className="py-4 d-flex flex-column gap-4">
      <section>
        <h5 className="mb-3">
          <i className="bi bi-clock-history me-2" aria-hidden="true" />
          Últimos resúmenes compartidos
        </h5>
        <UltimosEnviosStrip envios={enviosOrdenados} />
      </section>

      <section>
        <h5 className="mb-3">
          <i className="bi bi-receipt me-2" aria-hidden="true" />
          Todos los envíos
        </h5>
        <EnviosFiltros materias={materias} filtros={filtros} onFiltrosChange={setFiltros} />
        <EnviosTabla envios={enviosFiltrados} />
      </section>
    </Container>
  );
}
