// Roles del sistema (ver docs/schema.sql, columna `rol` de `usuario`):
// - administrador: mantenimiento del sistema, incluye el backoffice.
// - boss: uso común de la app, todo salvo el backoffice.
// - usuario: solo accede a la pestaña Herramientas.
export const ROLES = {
  ADMINISTRADOR: "administrador",
  BOSS: "boss",
  USUARIO: "usuario",
};

export const ETIQUETA_ROL = {
  administrador: "Administrador",
  boss: "Boss",
  usuario: "Usuario",
};
