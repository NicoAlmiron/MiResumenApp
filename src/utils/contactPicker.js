// Contact Picker API del navegador (https://developer.mozilla.org/docs/Web/API/Contact_Picker_API):
// deja elegir un contacto de la agenda del teléfono sin pasar por ningún
// backend ni cuenta de Google — es de ahí de donde WhatsApp también saca
// los suyos. Soporte limitado: por ahora solo Chrome/Android (ni iPhone ni
// desktop la tienen), por eso todo el uso de esto es opcional/con fallback.
export function soportaContactPicker() {
  return typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
}

// Devuelve { nombre, telefono } del contacto elegido, o null si el usuario
// canceló el selector nativo.
export async function elegirContacto() {
  const elegidos = await navigator.contacts.select(["name", "tel"], { multiple: false });
  if (elegidos.length === 0) return null;
  const [contacto] = elegidos;
  return {
    nombre: contacto.name?.[0] ?? "",
    telefono: contacto.tel?.[0] ?? "",
  };
}
