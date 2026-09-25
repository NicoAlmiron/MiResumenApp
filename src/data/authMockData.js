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

// 3 cuentas de ejemplo (una por rol) para poder probar las 3 vistas sin
// tener que usar primero "Crear usuario nuevo".
export const usuariosIniciales = [
  { id: 1, nombreUsuario: "admin", password: "admin123", rol: ROLES.ADMINISTRADOR },
  { id: 2, nombreUsuario: "boss", password: "boss123", rol: ROLES.BOSS },
  { id: 3, nombreUsuario: "usuario", password: "usuario123", rol: ROLES.USUARIO },
];
