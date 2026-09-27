const ICONOS_POR_EXTENSION = {
  pdf: "📕",
  doc: "📄",
  docx: "📄",
  xlsx: "📊",
  xls: "📊",
  pptx: "📽️",
  ppt: "📽️",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
};

export function iconoPorExtension(extension) {
  return ICONOS_POR_EXTENSION[extension?.toLowerCase()] ?? "📎";
}
