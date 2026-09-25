import { createContext, useContext, useState, useCallback } from "react";
import { usuariosIniciales, ROLES } from "../data/authMockData";
import { generarId } from "../data/mockData";

const AuthContext = createContext(null);
const CLAVE_STORAGE = "miresumen_auth";

// Cuando exista la API real (RF-29 a RF-33: passlib/bcrypt + JWT), este
// archivo se reemplaza por llamadas a la API — el resto de la app
// (RequireAuth, RequireRol, AppNavbar) no debería necesitar cambios porque
// solo dependen de `useAuth()`, no de cómo se resuelve el login por dentro.

function leerSesionGuardada() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null; // localStorage puede fallar (modo privado, storage bloqueado, etc.)
  }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_STORAGE);
  } catch {
    // si falla, la sesión sigue viva en memoria para esta pestaña igual
  }
}

// Datos públicos de un usuario (sin password) para guardar en sesión/localStorage.
function aPublico(u) {
  return { id: u.id, nombreUsuario: u.nombreUsuario, rol: u.rol };
}

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);

  // La sesión guardada se re-valida contra la lista de usuarios actual (por
  // id): si ese usuario ya no existe (por ejemplo, lo borraron desde el
  // backoffice en otra pestaña), no lo dejamos "logueado a medias".
  const [usuario, setUsuario] = useState(() => {
    const guardado = leerSesionGuardada();
    if (!guardado) return null;
    const existe = usuariosIniciales.find((u) => u.id === guardado.id);
    return existe ? aPublico(existe) : null;
  });

  const login = useCallback(
    (nombreUsuario, password) => {
      const encontrado = usuarios.find((u) => u.nombreUsuario === nombreUsuario && u.password === password);
      if (!encontrado) return false;
      const sesion = aPublico(encontrado);
      setUsuario(sesion);
      guardarSesion(sesion);
      return true;
    },
    [usuarios]
  );

  const logout = useCallback(() => {
    setUsuario(null);
    guardarSesion(null);
  }, []);

  // Crea un usuario nuevo. Devuelve null si ok, o un mensaje de error si el
  // nombre ya existe. La restricción de qué roles puede asignar quien crea
  // (un "boss" no puede dar de alta a otro "administrador") se resuelve en
  // el modal que llama a esto — acá solo se guarda.
  const crearUsuario = useCallback((datos) => {
    let resultado = null;
    setUsuarios((prev) => {
      if (prev.some((u) => u.nombreUsuario.toLowerCase() === datos.nombreUsuario.toLowerCase())) {
        resultado = "Ya existe un usuario con ese nombre.";
        return prev;
      }
      const nuevo = { id: generarId(), ...datos };
      resultado = null;
      return [...prev, nuevo];
    });
    return resultado;
  }, []);

  const cambiarNombreUsuario = useCallback(
    (nuevoNombre) => {
      if (!usuario) return "No hay sesión activa.";
      const yaExiste = usuarios.some(
        (u) => u.id !== usuario.id && u.nombreUsuario.toLowerCase() === nuevoNombre.toLowerCase()
      );
      if (yaExiste) return "Ya existe un usuario con ese nombre.";

      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, nombreUsuario: nuevoNombre } : u)));
      const sesion = { ...usuario, nombreUsuario: nuevoNombre };
      setUsuario(sesion);
      guardarSesion(sesion);
      return null;
    },
    [usuario, usuarios]
  );

  const cambiarPassword = useCallback(
    (passwordActual, passwordNueva) => {
      if (!usuario) return "No hay sesión activa.";
      const propio = usuarios.find((u) => u.id === usuario.id);
      if (!propio || propio.password !== passwordActual) return "La contraseña actual no es correcta.";

      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, password: passwordNueva } : u)));
      return null;
    },
    [usuario, usuarios]
  );

  // Backoffice: cambiar el rol de cualquier usuario. Evita que el último
  // administrador se quede sin acceso al bajarse su propio rol por error.
  const cambiarRolUsuario = useCallback(
    (id, nuevoRol) => {
      const cantidadAdmins = usuarios.filter((u) => u.rol === ROLES.ADMINISTRADOR).length;
      const objetivo = usuarios.find((u) => u.id === id);
      if (objetivo?.rol === ROLES.ADMINISTRADOR && nuevoRol !== ROLES.ADMINISTRADOR && cantidadAdmins <= 1) {
        return "Tiene que quedar al menos un administrador.";
      }
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)));
      if (usuario?.id === id) {
        const sesion = { ...usuario, rol: nuevoRol };
        setUsuario(sesion);
        guardarSesion(sesion);
      }
      return null;
    },
    [usuario, usuarios]
  );

  // Backoffice: eliminar un usuario. No se puede borrar a uno mismo ni dejar
  // el sistema sin ningún administrador.
  const eliminarUsuario = useCallback(
    (id) => {
      if (usuario?.id === id) return "No podés eliminar tu propio usuario.";
      const objetivo = usuarios.find((u) => u.id === id);
      const cantidadAdmins = usuarios.filter((u) => u.rol === ROLES.ADMINISTRADOR).length;
      if (objetivo?.rol === ROLES.ADMINISTRADOR && cantidadAdmins <= 1) {
        return "Tiene que quedar al menos un administrador.";
      }
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      return null;
    },
    [usuario, usuarios]
  );

  const value = {
    usuario,
    estaAutenticado: usuario != null,
    usuarios: usuarios.map(aPublico), // nunca se expone la password fuera de este archivo
    login,
    logout,
    crearUsuario,
    cambiarNombreUsuario,
    cambiarPassword,
    cambiarRolUsuario,
    eliminarUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
