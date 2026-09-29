import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { ROLES } from "../data/authMockData";
import { useAuth } from "./AuthContext";
import * as materiasApi from "../api/materias";
import * as tablerosApi from "../api/tableros";
import * as pedidosApi from "../api/pedidos";
import * as clientesApi from "../api/clientes";

const MateriasContext = createContext(null);

// Clave única de una hoja (Cátedra o Comisión), para comparar/deduplicar refs.
export function refHojaKey(ref) {
  return `${ref.materiaId}-${ref.catedraId}-${ref.comisionId ?? "x"}`;
}

// Encuentra y reemplaza la "hoja" (Cátedra sin Comisiones, o una Comisión puntual)
// dentro del árbol de materias, aplicando `updater` sobre una copia de esa hoja.
// Esto evita repetir la navegación materia -> catedra -> comision en cada acción.
function actualizarHoja(materias, { materiaId, catedraId, comisionId }, updater) {
  return materias.map((materia) => {
    if (materia.id !== materiaId) return materia;

    return {
      ...materia,
      catedras: materia.catedras.map((catedra) => {
        if (catedra.id !== catedraId) return catedra;

        if (comisionId == null) {
          return { ...catedra, ...updater(catedra) };
        }

        return {
          ...catedra,
          comisiones: catedra.comisiones.map((comision) =>
            comision.id === comisionId ? { ...comision, ...updater(comision) } : comision
          ),
        };
      }),
    };
  });
}

// GET /materias ya viene anidado con casi los mismos nombres de campo que
// necesita el frontend — acá solo se recorta a lo que se usa (se ignoran
// creado_en/materia_id/catedra_id, que son de la API, no del árbol UI).
function normalizarComision(c) {
  return { id: c.id, nombre: c.nombre, turno: c.turno, vecesCompartido: 0, tableroId: null, tablero: null };
}
function normalizarCatedra(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    profesor: c.profesor,
    vecesCompartido: 0,
    tableroId: null,
    tablero: null,
    comisiones: c.comisiones.map(normalizarComision),
  };
}
function normalizarMateria(m) {
  return {
    id: m.id,
    nombre: m.nombre,
    anio: m.anio,
    cuatrimestre: m.cuatrimestre,
    descripcion: m.descripcion,
    catedras: m.catedras.map(normalizarCatedra),
  };
}

// Cada Cátedra y cada Comisión tiene su propio tablero en el backend (se crea
// solo, al crearlas) — se piden todos en paralelo y se mergean en el árbol,
// para que CatedraRow/ComisionRow/SeccionButtons puedan seguir leyendo
// `hoja.tablero`/`hoja.vecesCompartido` directo, sin saber que son datos
// que vinieron de un endpoint aparte.
async function cargarTablerosDelArbol(materias) {
  const porCatedra = new Map();
  const porComision = new Map();
  const tareas = [];

  for (const materia of materias) {
    for (const catedra of materia.catedras) {
      tareas.push(tablerosApi.obtenerTableroDeCatedra(catedra.id).then((r) => porCatedra.set(catedra.id, r)));
      for (const comision of catedra.comisiones) {
        tareas.push(tablerosApi.obtenerTableroDeComision(comision.id).then((r) => porComision.set(comision.id, r)));
      }
    }
  }
  await Promise.all(tareas);

  return materias.map((materia) => ({
    ...materia,
    catedras: materia.catedras.map((catedra) => ({
      ...catedra,
      ...porCatedra.get(catedra.id),
      comisiones: catedra.comisiones.map((comision) => ({ ...comision, ...porComision.get(comision.id) })),
    })),
  }));
}

export function MateriasProvider({ children }) {
  const { estaAutenticado, cargandoSesion, usuario } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Cola de envío: lista de refs de hojas "preparadas" para compartir en tanda.
  // Vive aparte del árbol de materias porque es una selección temporal de UI,
  // no un dato del dominio.
  const [colaEnvio, setColaEnvio] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);

  useEffect(() => {
    if (cargandoSesion) return;
    // "usuario" (Herramientas nomás) no tiene nada acá. "administrador" ya no
    // tiene Materias propias — es supervisor puro, ve a los boss como
    // tarjetas (ver ResumenesPage.jsx) en vez de un árbol propio.
    if (!estaAutenticado || usuario.rol === ROLES.USUARIO || usuario.rol === ROLES.ADMINISTRADOR) {
      setMaterias([]);
      setCargando(false);
      setPedidos([]);
      setCargandoPedidos(false);
      setClientes([]);
      setCargandoClientes(false);
      return;
    }
    let cancelado = false;
    setCargando(true);
    materiasApi
      .listarMaterias()
      .then((datos) => cargarTablerosDelArbol(datos.map(normalizarMateria)))
      .then((arbol) => {
        if (!cancelado) setMaterias(arbol);
      })
      .catch(() => {
        if (!cancelado) setMaterias([]);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    setCargandoPedidos(true);
    pedidosApi
      .listarPedidos()
      .then((datos) => {
        if (!cancelado) setPedidos(datos);
      })
      .catch(() => {
        if (!cancelado) setPedidos([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoPedidos(false);
      });

    setCargandoClientes(true);
    clientesApi
      .listarClientes()
      .then((datos) => {
        if (!cancelado) setClientes(datos);
      })
      .catch(() => {
        if (!cancelado) setClientes([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoClientes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [estaAutenticado, cargandoSesion, usuario?.rol]);

  // Vuelve a pedir el tablero de UNA hoja puntual y lo mergea en el árbol —
  // se usa después de cualquier acción que lo modifique (subir/mover/eliminar
  // archivo, compartir), en vez de re-pedir todo el árbol de materias.
  const refrescarTablero = useCallback(async (ref) => {
    const resultado =
      ref.comisionId == null
        ? await tablerosApi.obtenerTableroDeCatedra(ref.catedraId)
        : await tablerosApi.obtenerTableroDeComision(ref.comisionId);
    setMaterias((prev) => actualizarHoja(prev, ref, () => resultado));
    return resultado;
  }, []);

  const crearMateria = useCallback(async (datos) => {
    const nueva = await materiasApi.crearMateria(datos);
    setMaterias((prev) => [...prev, normalizarMateria({ ...nueva, catedras: [] })]);
    return nueva.id;
  }, []);

  const crearCatedra = useCallback(async (materiaId, datos) => {
    const nueva = await materiasApi.crearCatedra(materiaId, datos);
    const tableroInfo = await tablerosApi.obtenerTableroDeCatedra(nueva.id);
    const catedraNormalizada = { ...normalizarCatedra({ ...nueva, comisiones: [] }), ...tableroInfo };
    setMaterias((prev) =>
      prev.map((m) => (m.id !== materiaId ? m : { ...m, catedras: [...m.catedras, catedraNormalizada] }))
    );
    return nueva.id;
  }, []);

  const crearComision = useCallback(async (materiaId, catedraId, datos) => {
    const nueva = await materiasApi.crearComision(catedraId, datos);
    const tableroInfo = await tablerosApi.obtenerTableroDeComision(nueva.id);
    const comisionNormalizada = { ...normalizarComision(nueva), ...tableroInfo };
    setMaterias((prev) =>
      prev.map((m) =>
        m.id !== materiaId
          ? m
          : {
              ...m,
              catedras: m.catedras.map((c) =>
                c.id !== catedraId ? c : { ...c, comisiones: [...c.comisiones, comisionNormalizada] }
              ),
            }
      )
    );
    return nueva.id;
  }, []);

  const subirArchivos = useCallback(
    async (ref, columna, archivos) => {
      const hoja = getHoja(materias, ref);
      if (!hoja) return;
      // `archivos` son File reales (input/drag&drop); el input permite elegir
      // varios a la vez, la API sube de a uno — se mandan en paralelo y se
      // refresca el tablero una sola vez.
      await Promise.all(archivos.map((archivo) => tablerosApi.subirArchivo(hoja.tableroId, archivo, columna)));
      await refrescarTablero(ref);
    },
    [materias, refrescarTablero]
  );

  const moverArchivo = useCallback(
    async (ref, archivoId, columnaOrigen, columnaDestino) => {
      if (columnaOrigen === columnaDestino) return;
      // La regla de "copiar en vez de mover" al llegar a 'listo' (con la
      // conversión simulada Word->PDF) ya vive en el backend (ArchivoService).
      await tablerosApi.moverArchivo(archivoId, columnaDestino);
      await refrescarTablero(ref);
    },
    [refrescarTablero]
  );

  const eliminarArchivo = useCallback(
    async (ref, columna, archivoId) => {
      await tablerosApi.eliminarArchivo(archivoId);
      await refrescarTablero(ref);
    },
    [refrescarTablero]
  );

  // Comparte una o varias hojas de una sola vez, agrupadas en UN pedido (un
  // cliente + una fecha + la lista de resúmenes mandados juntos). El backend
  // registra el pedido Y suma +1 a "veces compartido" de cada tablero
  // incluido en una sola operación — acá solo se refrescan esas hojas después.
  // `contacto` es { clienteId } (cliente ya registrado) o
  // { clienteNuevo: {nombre, telefono} } (se crea o reutiliza uno existente
  // con ese teléfono) — más `precio` opcional, ver RegistrarContactoModal.jsx.
  const registrarPedido = useCallback(
    async (refs, { clienteId, clienteNuevo, precio }) => {
      const refsValidos = refs.filter((ref) => getHoja(materias, ref)?.tableroId != null);
      if (refsValidos.length === 0) return null;

      const nuevoPedido = await pedidosApi.crearPedido({
        clienteId,
        clienteNuevo,
        precio: precio || null,
        tableroIds: refsValidos.map((ref) => getHoja(materias, ref).tableroId),
      });
      setPedidos((prev) => [nuevoPedido, ...prev]);
      // Si se registró un cliente nuevo, refrescar la lista para que aparezca
      // como "cliente existente" la próxima vez que se abra el modal.
      if (clienteNuevo) {
        clientesApi
          .listarClientes()
          .then(setClientes)
          .catch(() => {});
      }
      await Promise.all(refsValidos.map((ref) => refrescarTablero(ref)));
      return nuevoPedido;
    },
    [materias, refrescarTablero]
  );

  const editarMateria = useCallback(async (materiaId, nombre) => {
    await materiasApi.actualizarMateria(materiaId, { nombre });
    setMaterias((prev) => prev.map((m) => (m.id !== materiaId ? m : { ...m, nombre })));
  }, []);

  const editarCatedra = useCallback(async (materiaId, catedraId, nombre) => {
    await materiasApi.actualizarCatedra(catedraId, { nombre });
    setMaterias((prev) =>
      prev.map((m) =>
        m.id !== materiaId ? m : { ...m, catedras: m.catedras.map((c) => (c.id !== catedraId ? c : { ...c, nombre })) }
      )
    );
  }, []);

  // --- Backoffice (Administrador): editar todos los campos / eliminar ---
  const editarMateriaCompleta = useCallback(async (materiaId, cambios) => {
    await materiasApi.actualizarMateria(materiaId, cambios);
    setMaterias((prev) => prev.map((m) => (m.id !== materiaId ? m : { ...m, ...cambios })));
  }, []);

  const editarCatedraCompleta = useCallback(async (materiaId, catedraId, cambios) => {
    await materiasApi.actualizarCatedra(catedraId, cambios);
    setMaterias((prev) =>
      prev.map((m) =>
        m.id !== materiaId
          ? m
          : { ...m, catedras: m.catedras.map((c) => (c.id !== catedraId ? c : { ...c, ...cambios })) }
      )
    );
  }, []);

  const editarComision = useCallback(async (materiaId, catedraId, comisionId, cambios) => {
    await materiasApi.actualizarComision(comisionId, cambios);
    setMaterias((prev) =>
      prev.map((m) =>
        m.id !== materiaId
          ? m
          : {
              ...m,
              catedras: m.catedras.map((c) =>
                c.id !== catedraId
                  ? c
                  : { ...c, comisiones: c.comisiones.map((co) => (co.id !== comisionId ? co : { ...co, ...cambios })) }
              ),
            }
      )
    );
  }, []);

  const eliminarMateria = useCallback(async (materiaId) => {
    await materiasApi.eliminarMateria(materiaId);
    setMaterias((prev) => prev.filter((m) => m.id !== materiaId));
  }, []);

  const eliminarCatedra = useCallback(async (materiaId, catedraId) => {
    await materiasApi.eliminarCatedra(catedraId);
    setMaterias((prev) =>
      prev.map((m) => (m.id !== materiaId ? m : { ...m, catedras: m.catedras.filter((c) => c.id !== catedraId) }))
    );
  }, []);

  const eliminarComision = useCallback(async (materiaId, catedraId, comisionId) => {
    await materiasApi.eliminarComision(comisionId);
    setMaterias((prev) =>
      prev.map((m) =>
        m.id !== materiaId
          ? m
          : {
              ...m,
              catedras: m.catedras.map((c) =>
                c.id !== catedraId ? c : { ...c, comisiones: c.comisiones.filter((co) => co.id !== comisionId) }
              ),
            }
      )
    );
  }, []);

  // Solo para administrador: trae el árbol de UN boss puntual, de solo
  // lectura — no toca `materias` (que para admin siempre queda vacío), lo
  // devuelve para que lo guarde quien lo pida (ver AdminSupervisarPage.jsx).
  const cargarMateriasDeBoss = useCallback(async (usuarioId) => {
    const datos = await materiasApi.listarMaterias(usuarioId);
    return cargarTablerosDelArbol(datos.map(normalizarMateria));
  }, []);

  const eliminarPedido = useCallback(async (pedidoId) => {
    await pedidosApi.eliminarPedido(pedidoId);
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
  }, []);

  const agregarAColaEnvio = useCallback((ref) => {
    setColaEnvio((prev) => (prev.some((r) => refHojaKey(r) === refHojaKey(ref)) ? prev : [...prev, ref]));
  }, []);
  const quitarDeColaEnvio = useCallback((ref) => {
    setColaEnvio((prev) => prev.filter((r) => refHojaKey(r) !== refHojaKey(ref)));
  }, []);
  const vaciarColaEnvio = useCallback(() => setColaEnvio([]), []);
  const compartirCola = useCallback(
    async (contacto) => {
      const pedido = await registrarPedido(colaEnvio, contacto);
      setColaEnvio([]);
      return pedido;
    },
    [colaEnvio, registrarPedido]
  );

  const value = {
    materias,
    cargando,
    crearMateria,
    crearCatedra,
    crearComision,
    subirArchivos,
    moverArchivo,
    eliminarArchivo,
    registrarPedido,
    editarMateria,
    editarCatedra,
    colaEnvio,
    agregarAColaEnvio,
    quitarDeColaEnvio,
    vaciarColaEnvio,
    compartirCola,
    pedidos,
    cargandoPedidos,
    clientes,
    cargandoClientes,
    editarMateriaCompleta,
    editarCatedraCompleta,
    editarComision,
    eliminarMateria,
    eliminarCatedra,
    eliminarComision,
    eliminarPedido,
    cargarMateriasDeBoss,
  };

  return <MateriasContext.Provider value={value}>{children}</MateriasContext.Provider>;
}

export function useMaterias() {
  const ctx = useContext(MateriasContext);
  if (!ctx) throw new Error("useMaterias debe usarse dentro de <MateriasProvider>");
  return ctx;
}

// Devuelve la Cátedra o Comisión "hoja" identificada por ref = {materiaId, catedraId, comisionId?}.
// Si comisionId es null/undefined, la hoja es la propia Cátedra.
export function getHoja(materias, { materiaId, catedraId, comisionId }) {
  const materia = materias.find((m) => m.id === materiaId);
  const catedra = materia?.catedras.find((c) => c.id === catedraId);
  if (comisionId == null) return catedra;
  return catedra?.comisiones.find((co) => co.id === comisionId);
}

// Total de "secciones" activas de una materia: cátedras sin comisiones + comisiones.
export function contarSecciones(materia) {
  return materia.catedras.reduce((total, catedra) => {
    return total + (catedra.comisiones.length > 0 ? catedra.comisiones.length : 1);
  }, 0);
}

// Suma de "veces compartido" de TODAS las hojas de una materia (cátedras sin
// comisiones + comisiones), para mostrar un contador general en el modal.
export function contarComparticionesTotales(materia) {
  return materia.catedras.reduce((total, catedra) => {
    if (catedra.comisiones.length > 0) {
      return total + catedra.comisiones.reduce((sub, comision) => sub + comision.vecesCompartido, 0);
    }
    return total + catedra.vecesCompartido;
  }, 0);
}

// Contactos únicos ya usados en algún pedido (por teléfono), más recientes
// primero — alimenta el autocompletado del modal de "Registrar contacto".
export function contactosGuardados(pedidos) {
  const vistos = new Map();
  for (const pedido of pedidos) {
    const clave = pedido.contactoTelefono || pedido.contactoNombre;
    if (!vistos.has(clave)) {
      vistos.set(clave, { nombre: pedido.contactoNombre, telefono: pedido.contactoTelefono });
    }
  }
  return Array.from(vistos.values());
}
