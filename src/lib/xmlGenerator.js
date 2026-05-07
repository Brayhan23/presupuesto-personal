function escaparXML(valor) {
  if (valor === undefined || valor === null) return "";

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generarXMLPresupuesto(presupuesto) {
  const nombrePresupuesto = escaparXML(presupuesto.nombre);
  const presupuestoTotal = Number(presupuesto.presupuestoTotal || 0);
  const totalGastado = Number(presupuesto.totalGastado || 0);
  const porcentajeGastado = Number(presupuesto.porcentajeGastado || 0);
  const saldoDisponible = presupuestoTotal - totalGastado;

  const categoriasXML = presupuesto.categorias
    .map((categoria) => {
      const subcategoriasXML = categoria.subcategorias
        .map((subcategoria) => {
          return `
        <subcategoria id="${escaparXML(subcategoria._id)}">
          <nombre>${escaparXML(subcategoria.nombre)}</nombre>
          <valorGastado>${Number(subcategoria.valorGastado || 0)}</valorGastado>
          <porcentajeDelTotal>${Number(
            subcategoria.porcentajeDelTotal || 0
          )}</porcentajeDelTotal>
        </subcategoria>`;
        })
        .join("");

      return `
    <categoria id="${escaparXML(categoria._id)}">
      <nombre>${escaparXML(categoria.nombre)}</nombre>
      <descripcion>${escaparXML(categoria.descripcion)}</descripcion>
      <valorGastado>${Number(categoria.valorGastado || 0)}</valorGastado>
      <porcentajeDelTotal>${Number(
        categoria.porcentajeDelTotal || 0
      )}</porcentajeDelTotal>
      <subcategorias>${subcategoriasXML}
      </subcategorias>
    </categoria>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<presupuesto id="${escaparXML(presupuesto._id)}">
  <nombre>${nombrePresupuesto}</nombre>
  <presupuestoTotal>${presupuestoTotal}</presupuestoTotal>
  <totalGastado>${totalGastado}</totalGastado>
  <saldoDisponible>${saldoDisponible}</saldoDisponible>
  <porcentajeGastado>${porcentajeGastado}</porcentajeGastado>

  <arbol>
    <raiz>
      <nombre>${nombrePresupuesto}</nombre>
      <valor>${presupuestoTotal}</valor>
      <porcentaje>100</porcentaje>
    </raiz>

    <categorias>${categoriasXML}
    </categorias>
  </arbol>
</presupuesto>`;
}