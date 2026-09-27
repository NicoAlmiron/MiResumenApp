import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";

const AuthContext = createContext(null);
const CLAVE_STORAGE = "miresumen_auth";

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

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // true mientras se valida el token guardado contra GET /auth/me al
  // arrancar — RequireAuth espera este flag antes de decidir si redirige a
  // /login (si no, un F5 en una ruta privada rebota a Login un instante
  // antes de confirmar que la sesión sigue viva).
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const guardado = leerSesionGuardada();
    if (!guardado?.token) {
      setCargandoSesion(false);
      return;
    }
    authApi
      .obtenerMe()
      .then((actualizado) => {
        setUsuario(actualizado);
        guardarSesion({ token: guardado.token, usuario: actualizado });
      })
      .catch(() => {
        guardarSesion(null); // token vencido/inválido
      })
      .finally(() => setCargandoSesion(false));
  }, []);

  const login = useCallback(async (nombreUsuario, password) => {
    try {
      const { token, usuario: nuevoUsuario } = await authApi.login(nombreUsuario, password);
      guardarSesion({ token, usuario: nuevoUsuario });
      setUsuario(nuevoUsuario);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUsuario(null);
    guardarSesion(null);
  }, []);

  // Crea un usuario nuevo. Devuelve null si ok, o un mensaje de error si el
  // nombre ya existe (o si un boss intentó crear un administrador — eso lo
  // valida el backend, acá solo se traduce el error).
  const crearUsuario = useCallback(async (datos) => {
    try {
      await authApi.crearUsuario(datos);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "No se pudo crear el usuario.";
    }
  }, []);

  const listarUsuarios = useCallback(async () => {
    try {
      return await authApi.listarUsuarios();
    } catch {
      return [];
    }
  }, []);

  const cambiarNombreUsuario = useCallback(
    async (nuevoNombre) => {
      if (!usuario) return "No hay sesión activa.";
      try {
        const actualizado = await authApi.actualizarMe({ nombreUsuario: nuevoNombre });
        setUsuario(actualizado);
        guardarSesion({ token: leerSesionGuardada()?.token, usuario: actualizado });
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "No se pudo cambiar el nombre de usuario.";
      }
    },
    [usuario]
  );

  const cambiarPassword = useCallback(
    async (passwordActual, passwordNueva) => {
      if (!usuario) return "No hay sesión activa.";
      try {
        await authApi.actualizarMe({ passwordActual, passwordNueva });
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña.";
      }
    },
    [usuario]
  );

  // Backoffice: cambiar el rol de cualquier usuario. Si es el propio usuario
  // logueado, refresca también la sesión guardada con el rol nuevo.
  const cambiarRolUsuario = useCallback(
    async (id, nuevoRol) => {
      try {
        const actualizado = await authApi.cambiarRolUsuario(id, nuevoRol);
        if (usuario?.id === id) {
          setUsuario(actualizado);
          guardarSesion({ token: leerSesionGuardada()?.token, usuario: actualizado });
        }
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "No se pudo cambiar el rol.";
      }
    },
    [usuario]
  );

  // Backoffice: eliminar un usuario (el backend ya valida no auto-eliminarse
  // ni dejar el sistema sin ningún administrador).
  const eliminarUsuario = useCallback(async (id) => {
    try {
      await authApi.eliminarUsuario(id);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "No se pudo eliminar el usuario.";
    }
  }, []);

  // Vincula la cuenta de Google del usuario logueado (guarda su google_id).
  // `idToken` es el JWT que devuelve el botón de Google en el navegador, sin
  // verificar todavía — la verificación de firma pasa en el backend.
  const vincularGoogle = useCallback(
    async (idToken) => {
      if (!usuario) return "No hay sesión activa.";
      try {
        const actualizado = await authApi.vincularGoogle(idToken);
        setUsuario(actualizado);
        guardarSesion({ token: leerSesionGuardada()?.token, usuario: actualizado });
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "No se pudo vincular la cuenta de Google.";
      }
    },
    [usuario]
  );

  const desvincularGoogle = useCallback(async () => {
    if (!usuario) return "No hay sesión activa.";
    try {
      const actualizado = await authApi.desvincularGoogle();
      setUsuario(actualizado);
      guardarSesion({ token: leerSesionGuardada()?.token, usuario: actualizado });
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "No se pudo desvincular la cuenta de Google.";
    }
  }, [usuario]);

  const value = {
    usuario,
    estaAutenticado: usuario != null,
    cargandoSesion,
    login,
    logout,
    crearUsuario,
    listarUsuarios,
    cambiarNombreUsuario,
    cambiarPassword,
    cambiarRolUsuario,
    eliminarUsuario,
    vincularGoogle,
    desvincularGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
