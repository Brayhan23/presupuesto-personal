export function calcularResumen(presupuesto) {
  const presupuestoObj =
    typeof presupuesto.toObject === "function"
      ? presupuesto.toObject()
      : presupuesto;

  let totalGastado = 0;

  const categoriasConCalculos = presupuestoObj.categorias.map((categoria) => {
    const subcategorias = categoria.subcategorias || [];

    const valorGastadoCategoria = subcategorias.reduce(
      (acumulado, subcategoria) =>
        acumulado + Number(subcategoria.valorGastado || 0),
      0
    );

    totalGastado += valorGastadoCategoria;

    const porcentajeCategoria =
      presupuestoObj.presupuestoTotal > 0
        ? (valorGastadoCategoria / presupuestoObj.presupuestoTotal) * 100
        : 0;

    const subcategoriasConCalculos = subcategorias.map((subcategoria) => {
      const valorGastadoSubcategoria = Number(subcategoria.valorGastado || 0);

      const porcentajeSubcategoria =
        presupuestoObj.presupuestoTotal > 0
          ? (valorGastadoSubcategoria / presupuestoObj.presupuestoTotal) * 100
          : 0;

      return {
        ...subcategoria,
        valorGastado: valorGastadoSubcategoria,
        porcentajeDelTotal: Number(porcentajeSubcategoria.toFixed(2)),
      };
    });

    return {
      ...categoria,
      valorGastado: valorGastadoCategoria,
      porcentajeDelTotal: Number(porcentajeCategoria.toFixed(2)),
      subcategorias: subcategoriasConCalculos,
    };
  });

  const porcentajeGastado =
    presupuestoObj.presupuestoTotal > 0
      ? (totalGastado / presupuestoObj.presupuestoTotal) * 100
      : 0;

  return {
    ...presupuestoObj,
    totalGastado,
    porcentajeGastado: Number(porcentajeGastado.toFixed(2)),
    categorias: categoriasConCalculos,
  };
}