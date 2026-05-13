"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const categoriasBaseUI = [
  {
    nombre: "Alimentación",
    descripcion: "Gastos relacionados con comida, mercado y restaurantes",
  },
  {
    nombre: "Transporte",
    descripcion: "Gastos de movilidad, transporte público, gasolina o parqueaderos",
  },
  {
    nombre: "Vivienda",
    descripcion: "Gastos de arriendo, administración o mantenimiento del hogar",
  },
  {
    nombre: "Servicios públicos",
    descripcion: "Agua, energía, gas, internet y telefonía",
  },
  {
    nombre: "Salud",
    descripcion: "Medicamentos, citas médicas y bienestar personal",
  },
  {
    nombre: "Educación",
    descripcion: "Matrícula, cursos, libros y materiales de estudio",
  },
  {
    nombre: "Entretenimiento",
    descripcion: "Cine, videojuegos, salidas, plataformas y ocio",
  },
  {
    nombre: "Ahorro",
    descripcion: "Dinero reservado para metas personales o emergencias",
  },
  {
    nombre: "Deudas",
    descripcion: "Créditos, préstamos, tarjetas o cuotas pendientes",
  },
  {
    nombre: "Otros",
    descripcion: "Gastos que no pertenecen a las demás categorías",
  },
];

const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function formatearMoneda(valor) {
  return formatoMoneda.format(Number(valor || 0));
}

function formatearPorcentaje(valor) {
  return `${Number(valor || 0).toFixed(2)}%`;
}

export default function Home() {
  const [vista, setVista] = useState("inicio");
  const [presupuestos, setPresupuestos] = useState([]);
  const [presupuestoSeleccionadoId, setPresupuestoSeleccionadoId] = useState("");
  const [categoriaTipo, setCategoriaTipo] = useState("base");
  const [xmlVisible, setXmlVisible] = useState(false);
  const [presupuesto, setPresupuesto] = useState(null);
  const [xmlReporte, setXmlReporte] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const categoriaFormRef = useRef(null);
  const subcategoriaFormRef = useRef(null);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  const [mensaje, setMensaje] = useState({
    tipo: "",
    texto: "",
  });

  const [presupuestoForm, setPresupuestoForm] = useState({
    nombre: "Presupuesto personal",
    presupuestoTotal: "",
  });

  const [categoriaForm, setCategoriaForm] = useState({
    id: "",
    nombre: "",
    descripcion: "",
  });

  const [subcategoriaForm, setSubcategoriaForm] = useState({
    id: "",
    categoriaId: "",
    nombre: "",
    valorGastado: "",
  });

  const categorias = presupuesto?.categorias || [];

  const datosGraficoCategorias = useMemo(() => {
    return categorias
      .filter((categoria) => Number(categoria.valorGastado || 0) > 0)
      .map((categoria) => ({
        nombre:
          categoria.nombre.length > 14
            ? `${categoria.nombre.substring(0, 14)}...`
            : categoria.nombre,
        nombreCompleto: categoria.nombre,
        valorGastado: Number(categoria.valorGastado || 0),
        porcentajeDelTotal: Number(categoria.porcentajeDelTotal || 0),
      }))
      .sort((a, b) => b.valorGastado - a.valorGastado);
  }, [categorias]);

  const categoriasMayorGasto = useMemo(() => {
    return [...datosGraficoCategorias].slice(0, 3);
  }, [datosGraficoCategorias]);

  const estadoFinanciero = useMemo(() => {
    const porcentaje = Number(presupuesto?.porcentajeGastado || 0);

    if (porcentaje < 60) {
      return {
        titulo: "Bajo control",
        descripcion:
          "El presupuesto se mantiene en un nivel saludable de gasto.",
        clase:
          "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
      };
    }

    if (porcentaje < 85) {
      return {
        titulo: "Cuidado",
        descripcion:
          "Ya se ha usado una parte considerable del presupuesto disponible.",
        clase:
          "border-amber-400/30 bg-amber-500/10 text-amber-200",
      };
    }

    return {
      titulo: "Presupuesto crítico",
      descripcion:
        "El gasto está cerca de consumir la mayor parte del presupuesto.",
      clase:
        "border-red-400/30 bg-red-500/10 text-red-200",
    };
  }, [presupuesto]);

  const saldoDisponible = useMemo(() => {
    if (!presupuesto) return 0;
    return Number(presupuesto.presupuestoTotal || 0) - Number(presupuesto.totalGastado || 0);
  }, [presupuesto]);

  useEffect(() => {
    cargarListaPresupuestos();
  }, []);

  useEffect(() => {
    if (!presupuesto?.categorias?.length) {
      setSubcategoriaForm((prev) => ({
        ...prev,
        categoriaId: "",
      }));
      return;
    }

    const categoriaExisteEnPresupuesto = presupuesto.categorias.some(
      (categoria) => categoria._id === subcategoriaForm.categoriaId
    );

    if (!categoriaExisteEnPresupuesto) {
      setSubcategoriaForm((prev) => ({
        ...prev,
        categoriaId: presupuesto.categorias[0]._id,
      }));
    }
  }, [presupuesto, subcategoriaForm.categoriaId]);

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto });
  }


  function obtenerPresupuestoActualId() {
    const id = presupuesto?._id || presupuestoSeleccionadoId;

    if (!id) {
      throw new Error("No hay un presupuesto seleccionado");
    }

    return id;
  }

  async function cargarListaPresupuestos() {
    try {
      setCargando(true);

      const response = await fetch("/api/presupuestos", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudieron cargar los presupuestos");
      }

      setPresupuestos(data.data || []);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setCargando(false);
    }
  }

  function limpiarCategoriaForm() {
    setCategoriaForm({
      id: "",
      nombre: "",
      descripcion: "",
    });
  }

  function limpiarSubcategoriaForm(presupuestoBase = presupuesto, categoriaIdPreferida = "") {
    const categoriasBase = presupuestoBase?.categorias || [];

    const categoriaExiste = categoriasBase.some(
      (categoria) => categoria._id === categoriaIdPreferida
    );

    const categoriaId = categoriaExiste
      ? categoriaIdPreferida
      : categoriasBase[0]?._id || "";

    setSubcategoriaForm({
      id: "",
      categoriaId,
      nombre: "",
      valorGastado: "",
    });
  }

  async function cargarPresupuesto(id = presupuestoSeleccionadoId) {
    try {
      setCargando(true);

      const url = id
        ? `/api/presupuesto?presupuestoId=${id}`
        : "/api/presupuesto";

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo cargar el presupuesto");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);

      setCategoriaForm({
        id: "",
        nombre: "",
        descripcion: "",
      });

      setSubcategoriaForm({
        id: "",
        categoriaId: data.data.categorias?.[0]?._id || "",
        nombre: "",
        valorGastado: "",
      });

      setCategoriaTipo("base");
      setXmlReporte("");
      setXmlVisible(false);
      setDashboardVisible(false);
      setVista("app");
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarXML() {
    try {
      const idPresupuestoActual = obtenerPresupuestoActualId();

      const response = await fetch(
        `/api/reportes/xml?presupuestoId=${idPresupuestoActual}`,
        {
          cache: "no-store",
        }
      );

      const texto = await response.text();

      setXmlReporte(texto);
      setXmlVisible(true);
    } catch (error) {
      setXmlReporte(`Error cargando XML: ${error.message}`);
      setXmlVisible(true);
    }
  }

  async function handleCrearPresupuesto(e) {
    e.preventDefault();

    try {
      setGuardando(true);

      const response = await fetch("/api/presupuesto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: presupuestoForm.nombre,
          presupuestoTotal: Number(presupuestoForm.presupuestoTotal),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo crear el presupuesto");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);

      setCategoriaForm({
        id: "",
        nombre: "",
        descripcion: "",
      });

      limpiarSubcategoriaForm(data.data);

      setCategoriaTipo("base");
      setVista("app");
      setXmlReporte("");
      setXmlVisible(false);
      setDashboardVisible(false);
      mostrarMensaje("ok", "Presupuesto creado correctamente");
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarCategoria(e) {
    e.preventDefault();

    try {
      setGuardando(true);

      const esEdicion = Boolean(categoriaForm.id);
      const idPresupuestoActual = obtenerPresupuestoActualId();

      const response = await fetch(
        esEdicion
          ? `/api/categorias/${categoriaForm.id}?presupuestoId=${idPresupuestoActual}`
          : `/api/categorias?presupuestoId=${idPresupuestoActual}`,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: categoriaForm.nombre,
            descripcion: categoriaForm.descripcion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo guardar la categoría");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);
      mostrarMensaje(
        "ok",
        esEdicion
          ? "Categoría actualizada correctamente"
          : "Categoría creada correctamente"
      );

      limpiarCategoriaForm();
      setXmlReporte("");
      setXmlVisible(false);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarCategoria(categoriaId) {
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta categoría?");
    if (!confirmar) return;

    try {
      setGuardando(true);

      const idPresupuestoActual = obtenerPresupuestoActualId();

      const response = await fetch(
        `/api/categorias/${categoriaId}?presupuestoId=${idPresupuestoActual}`,
        {
          method: "DELETE",
        }
      );


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo eliminar la categoría");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);
      mostrarMensaje("ok", "Categoría eliminada correctamente");
      limpiarCategoriaForm();
      limpiarSubcategoriaForm(data.data);
      setXmlReporte("");
      setXmlVisible(false);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarSubcategoria(e) {
    e.preventDefault();

    try {
      setGuardando(true);

      if (!subcategoriaForm.categoriaId) {
        throw new Error("Debes seleccionar una categoría");
      }

      const esEdicion = Boolean(subcategoriaForm.id);
      const idPresupuestoActual = obtenerPresupuestoActualId();

      const url = esEdicion
        ? `/api/categorias/${subcategoriaForm.categoriaId}/subcategorias/${subcategoriaForm.id}?presupuestoId=${idPresupuestoActual}`
        : `/api/categorias/${subcategoriaForm.categoriaId}/subcategorias?presupuestoId=${idPresupuestoActual}`;

      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: subcategoriaForm.nombre,
          valorGastado: Number(subcategoriaForm.valorGastado),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo guardar la subcategoría");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);
      mostrarMensaje(
        "ok",
        esEdicion
          ? "Subcategoría actualizada correctamente"
          : "Subcategoría creada correctamente"
      );

      limpiarSubcategoriaForm(data.data, subcategoriaForm.categoriaId);
      setXmlReporte("");
      setXmlVisible(false);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarSubcategoria(categoriaId, subcategoriaId) {
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta subcategoría?");
    if (!confirmar) return;

    try {
      setGuardando(true);

      const idPresupuestoActual = obtenerPresupuestoActualId();

      const response = await fetch(
        `/api/categorias/${categoriaId}/subcategorias/${subcategoriaId}?presupuestoId=${idPresupuestoActual}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo eliminar la subcategoría");
      }

      setPresupuesto(data.data);
      setPresupuestoSeleccionadoId(data.data._id);
      mostrarMensaje("ok", "Subcategoría eliminada correctamente");
      limpiarSubcategoriaForm(data.data, categoriaId);
      setXmlReporte("");
      setXmlVisible(false);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  function moverASeccion(ref) {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function cargarCategoriaParaEditar(categoria) {
    setCategoriaTipo("personalizada");

    setCategoriaForm({
      id: categoria._id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });

    moverASeccion(categoriaFormRef);
  }

  function cargarSubcategoriaParaEditar(categoria, subcategoria) {
    setSubcategoriaForm({
      id: subcategoria._id,
      categoriaId: categoria._id,
      nombre: subcategoria.nombre,
      valorGastado: subcategoria.valorGastado,
    });

    moverASeccion(subcategoriaFormRef);
  }

  function agregarGraficoBarrasPDF(doc, datos, startY) {
    if (!datos || datos.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("No hay gastos registrados para graficar.", 14, startY);
      return startY + 10;
    }

    const maxValor = Math.max(...datos.map((item) => item.valorGastado));
    const chartX = 18;
    const chartY = startY + 8;
    const chartWidth = 170;
    const chartHeight = 70;

    // Margen interno para que las barras no toquen ni se salgan del marco
    const paddingX = 12;
    const innerChartWidth = chartWidth - paddingX * 2;

    const barGap = 8;
    const barWidth = Math.max(
      12,
      (innerChartWidth - barGap * (datos.length - 1)) / datos.length
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Gráfico de gastos por categoría", 14, startY);

    // Fondo del gráfico
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, "FD");

    datos.forEach((item, index) => {
      const valor = Number(item.valorGastado || 0);
      const alturaBarra = maxValor > 0 ? (valor / maxValor) * 45 : 0;

      const x = chartX + paddingX + index * (barWidth + barGap);
      const y = chartY + chartHeight - 18 - alturaBarra;

      // Barra
      doc.setFillColor(34, 211, 238);
      doc.roundedRect(x, y, barWidth, alturaBarra, 2, 2, "F");

      // Valor encima
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(
        formatearMoneda(valor).replace("COP", "").trim(),
        x,
        y - 3,
        { maxWidth: barWidth }
      );

      // Nombre debajo
      doc.setFontSize(7);
      doc.text(item.nombre, x, chartY + chartHeight - 8, {
        maxWidth: barWidth + 8,
      });
    });

    doc.setTextColor(0, 0, 0);

    return chartY + chartHeight + 12;
  }

  function descargarPDF() {
    if (!presupuesto) {
      mostrarMensaje("error", "Primero debes abrir o crear un presupuesto");
      return;
    }

    const doc = new jsPDF();

    const fechaGeneracion = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const nombreArchivo = `reporte-${presupuesto.nombre || "presupuesto"}`
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^\w-]/g, "");

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte de Presupuesto Personal", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${fechaGeneracion}`, 14, 26);
    doc.text(`Presupuesto: ${presupuesto.nombre}`, 14, 32);

    // Resumen general
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumen general", 14, 45);

    const saldoActual =
      Number(presupuesto.presupuestoTotal || 0) -
      Number(presupuesto.totalGastado || 0);

    autoTable(doc, {
      startY: 50,
      head: [["Concepto", "Valor"]],
      body: [
        ["Presupuesto total", formatearMoneda(presupuesto.presupuestoTotal)],
        ["Total gastado", formatearMoneda(presupuesto.totalGastado)],
        ["Saldo disponible", formatearMoneda(saldoActual)],
        ["Porcentaje gastado", formatearPorcentaje(presupuesto.porcentajeGastado)],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    // Detalle de gastos
    const filasDetalle = [];

    categorias.forEach((categoria) => {
      filasDetalle.push([
        "Categoría",
        categoria.nombre,
        formatearMoneda(categoria.valorGastado),
        formatearPorcentaje(categoria.porcentajeDelTotal),
      ]);

      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        categoria.subcategorias.forEach((subcategoria) => {
          filasDetalle.push([
            "Subcategoría",
            `  - ${subcategoria.nombre}`,
            formatearMoneda(subcategoria.valorGastado),
            formatearPorcentaje(subcategoria.porcentajeDelTotal),
          ]);
        });
      }
    });

    const inicioGrafico = doc.lastAutoTable?.finalY
      ? doc.lastAutoTable.finalY + 12
      : 90;

    const despuesGrafico = agregarGraficoBarrasPDF(
      doc,
      datosGraficoCategorias,
      inicioGrafico
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Detalle por categorías y subcategorías", 14, despuesGrafico);

    autoTable(doc, {
      startY: despuesGrafico + 5,
      head: [["Tipo", "Nombre", "Valor gastado", "% del total"]],
      body:
        filasDetalle.length > 0
          ? filasDetalle
          : [["Sin datos", "No hay categorías registradas", "$0", "0%"]],
      theme: "striped",
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 78 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.row.raw[0] === "Categoría") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    // Nota final
    const finalY = doc.lastAutoTable?.finalY || 260;

    if (finalY < 270) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Reporte generado automáticamente desde la aplicación de presupuesto personal.",
        14,
        finalY + 10
      );
    }

    // Numeración de páginas
    const totalPaginas = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${totalPaginas}`,
        170,
        290
      );
    }

    doc.save(`${nombreArchivo || "reporte-presupuesto"}.pdf`);
  }


  if (cargando) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
          <p className="text-lg font-semibold text-cyan-300">Cargando presupuesto...</p>
          <p className="mt-2 text-sm text-white/60">Espera un momento mientras se consulta la información.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Proyecto de Presupuesto Personal
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Panel de control financiero
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
                Administra tu presupuesto de manera jerárquica con categorías,
                subcategorías, porcentajes del total y reporte XML generado automáticamente.
              </p>
            </div>
            {vista === "app" && presupuesto && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setVista("inicio");
                    setPresupuesto(null);
                    setPresupuestoSeleccionadoId("");
                    setXmlReporte("");
                    setXmlVisible(false);
                    cargarListaPresupuestos();
                  }}

                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Volver al inicio
                </button>

                <button
                  onClick={() => cargarPresupuesto(presupuesto?._id || presupuestoSeleccionadoId)}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  Actualizar datos
                </button>
              </div>
            )}
          </div>
        </section>

        {mensaje.texto && (

          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${mensaje.tipo === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              }`}
          >
            {mensaje.texto}
          </div>
        )}

        {vista === "inicio" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Inicio
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                ¿Qué deseas hacer?
              </h2>

              <p className="mt-3 text-sm text-white/65">
                Puedes crear un nuevo presupuesto o abrir uno que ya esté guardado en la base de datos.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setPresupuesto(null);
                    setVista("crear");
                    setXmlReporte("");
                    setXmlVisible(false);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Crear nuevo presupuesto
                </button>

                <button
                  onClick={cargarListaPresupuestos}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Actualizar lista
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-violet-200">
                Presupuestos guardados
              </h2>

              <p className="mt-2 text-sm text-white/65">
                Selecciona un presupuesto existente para abrirlo y continuar editándolo.
              </p>

              <div className="mt-5 space-y-3">
                {presupuestos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-sm text-white/55">
                    No hay presupuestos guardados todavía.
                  </div>
                ) : (
                  presupuestos.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{item.nombre}</h3>
                          <p className="mt-1 text-sm text-white/60">
                            Total: {formatearMoneda(item.presupuestoTotal)} · Gastado:{" "}
                            {formatearMoneda(item.totalGastado)} ·{" "}
                            {formatearPorcentaje(item.porcentajeGastado)}
                          </p>
                        </div>

                        <button
                          onClick={() => cargarPresupuesto(item._id)}
                          className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                        >
                          Abrir presupuesto
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {vista === "crear" && !presupuesto && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-violet-200">
                Crear presupuesto inicial
              </h2>
              <p className="mt-2 text-sm text-white/65">
                La primera vez debes crear el presupuesto base. El sistema agregará automáticamente
                las categorías principales por defecto.
              </p>

              <form onSubmit={handleCrearPresupuesto} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Nombre del presupuesto
                  </label>
                  <input
                    type="text"
                    value={presupuestoForm.nombre}
                    onChange={(e) =>
                      setPresupuestoForm({
                        ...presupuestoForm,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-cyan-400/50"
                    placeholder="Ej: Presupuesto Mayo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Presupuesto total
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={presupuestoForm.presupuestoTotal}
                    onChange={(e) =>
                      setPresupuestoForm({
                        ...presupuestoForm,
                        presupuestoTotal: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-cyan-400/50"
                    placeholder="Ej: 1500000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Crear presupuesto"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-cyan-200">
                Categorías base incluidas
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  "Alimentación",
                  "Transporte",
                  "Vivienda",
                  "Servicios públicos",
                  "Salud",
                  "Educación",
                  "Entretenimiento",
                  "Ahorro",
                  "Deudas",
                  "Otros",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {vista === "app" && presupuesto && (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <ResumenCard
                titulo="Presupuesto total"
                valor={formatearMoneda(presupuesto.presupuestoTotal)}
                color="cyan"
              />
              <ResumenCard
                titulo="Total gastado"
                valor={formatearMoneda(presupuesto.totalGastado)}
                color="violet"
              />
              <ResumenCard
                titulo="Saldo disponible"
                valor={formatearMoneda(saldoDisponible)}
                color="emerald"
              />
              <ResumenCard
                titulo="Porcentaje gastado"
                valor={formatearPorcentaje(presupuesto.porcentajeGastado)}
                color="amber"
              />
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                    Análisis visual
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    Dashboard de gastos
                  </h2>
                  <p className="mt-2 text-sm text-white/60">
                    Visualiza el comportamiento del presupuesto mediante gráficos y un estado financiero automático.
                  </p>
                </div>

                <button
                  onClick={() => setDashboardVisible(!dashboardVisible)}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  {dashboardVisible ? "Ocultar análisis" : "Ver análisis gráfico"}
                </button>
              </div>

              {dashboardVisible && (
                <DashboardFinanciero
                  datosGraficoCategorias={datosGraficoCategorias}
                  categoriasMayorGasto={categoriasMayorGasto}
                  estadoFinanciero={estadoFinanciero}
                  formatearMoneda={formatearMoneda}
                  formatearPorcentaje={formatearPorcentaje}
                />
              )}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div
                  ref={categoriaFormRef}
                  className="scroll-mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl"
                >
                  <h2 className="text-xl font-bold text-violet-200">
                    Administrar categorías
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    Puedes usar las categorías principales ya creadas o agregar una nueva si no existe.
                  </p>

                  <form onSubmit={handleGuardarCategoria} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Seleccionar categoría base
                      </label>

                      <select
                        value={categoriaTipo}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setCategoriaTipo(valor);

                          if (valor !== "personalizada" && valor !== "base") {
                            const categoriaBase = categoriasBaseUI.find(
                              (categoria) => categoria.nombre === valor
                            );

                            if (categoriaBase) {
                              setCategoriaForm({
                                id: "",
                                nombre: categoriaBase.nombre,
                                descripcion: categoriaBase.descripcion,
                              });
                            }
                          } else {
                            setCategoriaForm({
                              id: "",
                              nombre: "",
                              descripcion: "",
                            });
                          }
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-violet-400/50"
                      >
                        <option value="base">Selecciona una categoría base</option>

                        {categoriasBaseUI
                          .filter(
                            (base) =>
                              !categorias.some(
                                (actual) =>
                                  actual.nombre.trim().toLowerCase() ===
                                  base.nombre.trim().toLowerCase()
                              )
                          )
                          .map((categoria) => (
                            <option key={categoria.nombre} value={categoria.nombre}>
                              {categoria.nombre}
                            </option>
                          ))}

                        <option value="personalizada">Otra categoría personalizada</option>
                      </select>

                      <p className="mt-2 text-xs text-white/50">
                        Solo aparecen categorías base que todavía no estén agregadas al presupuesto.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Nombre de la categoría
                      </label>

                      <input
                        type="text"
                        value={categoriaForm.nombre}
                        onChange={(e) =>
                          setCategoriaForm({
                            ...categoriaForm,
                            nombre: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-violet-400/50"
                        placeholder="Ej: Mascotas"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Descripción
                      </label>
                      <textarea
                        rows="3"
                        value={categoriaForm.descripcion}
                        onChange={(e) =>
                          setCategoriaForm({
                            ...categoriaForm,
                            descripcion: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-violet-400/50"
                        placeholder="Describe brevemente esta categoría"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
                      >
                        {categoriaForm.id ? "Actualizar categoría" : "Agregar categoría"}
                      </button>

                      <button
                        type="button"
                        onClick={limpiarCategoriaForm}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                </div>

                <div
                  ref={subcategoriaFormRef}
                  className="scroll-mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl"
                >
                  <h2 className="text-xl font-bold text-cyan-200">
                    Administrar subcategorías
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    Selecciona una categoría y registra el gasto en la subcategoría correspondiente.
                  </p>

                  <form onSubmit={handleGuardarSubcategoria} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Categoría
                      </label>
                      <select
                        value={subcategoriaForm.categoriaId}
                        onChange={(e) =>
                          setSubcategoriaForm({
                            ...subcategoriaForm,
                            categoriaId: e.target.value,
                          })
                        }
                        disabled={Boolean(subcategoriaForm.id)}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-cyan-400/50 disabled:opacity-60"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categorias.map((categoria) => (
                          <option key={categoria._id} value={categoria._id}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                      {subcategoriaForm.id && (
                        <p className="mt-2 text-xs text-white/50">
                          Cuando editas, la subcategoría se mantiene en su categoría actual.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Nombre de la subcategoría
                      </label>
                      <input
                        type="text"
                        value={subcategoriaForm.nombre}
                        onChange={(e) =>
                          setSubcategoriaForm({
                            ...subcategoriaForm,
                            nombre: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-cyan-400/50"
                        placeholder="Ej: Mercado"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Valor gastado
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={subcategoriaForm.valorGastado}
                        onChange={(e) =>
                          setSubcategoriaForm({
                            ...subcategoriaForm,
                            valorGastado: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-cyan-400/50"
                        placeholder="Ej: 250000"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-60"
                      >
                        {subcategoriaForm.id ? "Actualizar subcategoría" : "Agregar subcategoría"}
                      </button>

                      <button
                        type="button"
                        onClick={limpiarSubcategoriaForm}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-emerald-200">
                        Reportes del presupuesto
                      </h2>
                      <p className="mt-1 text-sm text-white/65">
                        Genera el árbol XML o descarga un reporte PDF con el resumen actual del presupuesto.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={cargarXML}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                    >
                      Generar XML
                    </button>

                    <button
                      onClick={descargarPDF}
                      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
                    >
                      Descargar PDF
                    </button>
                  </div>

                  {xmlVisible && (
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4">
                      <pre className="whitespace-pre-wrap text-xs leading-6 text-emerald-200">
                        {xmlReporte || "No hay XML disponible todavía."}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Árbol del presupuesto
                    </h2>
                    <p className="mt-2 text-sm text-white/65">
                      Aquí visualizas el presupuesto total, las categorías y sus subcategorías con su respectivo gasto.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                      Presupuesto actual
                    </p>
                    <p className="mt-1 text-lg font-bold text-cyan-200">
                      {presupuesto.nombre}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-white/60">Raíz del árbol</p>
                      <h3 className="text-2xl font-bold text-white">
                        {presupuesto.nombre}
                      </h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-white/60">Valor total</p>
                      <p className="text-2xl font-bold text-cyan-200">
                        {formatearMoneda(presupuesto.presupuestoTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-white/70">Porcentaje gastado</span>
                      <span className="font-semibold text-amber-200">
                        {formatearPorcentaje(presupuesto.porcentajeGastado)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                        style={{
                          width: `${Math.min(Number(presupuesto.porcentajeGastado || 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {categorias.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-white/55">
                      No hay categorías registradas todavía.
                    </div>
                  ) : (
                    categorias.map((categoria) => (
                      <div
                        key={categoria._id}
                        className="rounded-3xl border border-white/10 bg-black/30 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
                              Categoría
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-white">
                              {categoria.nombre}
                            </h3>
                            <p className="mt-2 text-sm text-white/60">
                              {categoria.descripcion || "Sin descripción"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => cargarCategoriaParaEditar(categoria)}
                              className="rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarCategoria(categoria._id)}
                              className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                              Valor gastado
                            </p>
                            <p className="mt-2 text-lg font-bold text-cyan-200">
                              {formatearMoneda(categoria.valorGastado)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                                Porcentaje del total
                              </p>
                              <p className="text-sm font-semibold text-amber-200">
                                {formatearPorcentaje(categoria.porcentajeDelTotal)}
                              </p>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white/10">
                              <div
                                className="h-2 rounded-full bg-violet-400"
                                style={{
                                  width: `${Math.min(Number(categoria.porcentajeDelTotal || 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-sm font-semibold text-white/80">
                            Subcategorías
                          </p>

                          {categoria.subcategorias?.length === 0 ? (
                            <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-white/55">
                              Esta categoría aún no tiene subcategorías.
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {categoria.subcategorias.map((subcategoria) => (
                                <div
                                  key={subcategoria._id}
                                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                >
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="text-base font-semibold text-white">
                                        {subcategoria.nombre}
                                      </p>
                                      <p className="mt-1 text-sm text-white/60">
                                        Gasto:{" "}
                                        <span className="font-semibold text-cyan-200">
                                          {formatearMoneda(subcategoria.valorGastado)}
                                        </span>{" "}
                                        ·{" "}
                                        <span className="font-semibold text-amber-200">
                                          {formatearPorcentaje(subcategoria.porcentajeDelTotal)}
                                        </span>
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        onClick={() =>
                                          cargarSubcategoriaParaEditar(categoria, subcategoria)
                                        }
                                        className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleEliminarSubcategoria(
                                            categoria._id,
                                            subcategoria._id
                                          )
                                        }
                                        className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DashboardFinanciero({
  datosGraficoCategorias,
  categoriasMayorGasto,
  estadoFinanciero,
  formatearMoneda,
  formatearPorcentaje,
}) {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Gasto por categoría
            </h3>
            <p className="text-sm text-white/55">
              Comparación visual de las categorías con gasto registrado.
            </p>
          </div>
        </div>

        {datosGraficoCategorias.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-center text-sm text-white/55">
            Aún no hay gastos registrados para graficar.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGraficoCategorias}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    Number(value) >= 1000000
                      ? `${Number(value / 1000000).toFixed(1)}M`
                      : `${Number(value / 1000).toFixed(0)}K`
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null;
                    }

                    const item = payload[0].payload;

                    return (
                      <div className="rounded-2xl border border-white/10 bg-neutral-950 p-3 text-sm shadow-xl">
                        <p className="font-semibold text-white">
                          {item.nombreCompleto}
                        </p>
                        <p className="mt-1 text-cyan-200">
                          Gasto: {formatearMoneda(item.valorGastado)}
                        </p>
                        <p className="text-amber-200">
                          Porcentaje:{" "}
                          {formatearPorcentaje(item.porcentajeDelTotal)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="valorGastado"
                  radius={[10, 10, 0, 0]}
                  fill="#22d3ee"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className={`rounded-3xl border p-5 ${estadoFinanciero.clase}`}>
          <p className="text-sm uppercase tracking-[0.2em] opacity-75">
            Estado financiero
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {estadoFinanciero.titulo}
          </h3>
          <p className="mt-3 text-sm opacity-85">
            {estadoFinanciero.descripcion}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <h3 className="text-lg font-bold text-white">
            Categorías con mayor gasto
          </h3>
          <p className="mt-1 text-sm text-white/55">
            Top 3 según el valor gastado.
          </p>

          <div className="mt-4 space-y-3">
            {categoriasMayorGasto.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/55">
                No hay gastos registrados todavía.
              </div>
            ) : (
              categoriasMayorGasto.map((categoria, index) => (
                <div
                  key={categoria.nombreCompleto}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/45">
                        #{index + 1}
                      </p>
                      <h4 className="font-semibold text-white">
                        {categoria.nombreCompleto}
                      </h4>
                    </div>

                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {formatearPorcentaje(categoria.porcentajeDelTotal)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-cyan-200">
                    {formatearMoneda(categoria.valorGastado)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenCard({ titulo, valor, color }) {
  const estilos = {
    cyan: "from-cyan-500/20 to-cyan-400/5 text-cyan-200",
    violet: "from-violet-500/20 to-violet-400/5 text-violet-200",
    emerald: "from-emerald-500/20 to-emerald-400/5 text-emerald-200",
    amber: "from-amber-500/20 to-amber-400/5 text-amber-200",
  };

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-br ${estilos[color]} p-5 shadow-xl`}
    >
      <p className="text-sm text-white/60">{titulo}</p>
      <h3 className="mt-3 text-2xl font-bold text-white">{valor}</h3>
    </div>
  );
}