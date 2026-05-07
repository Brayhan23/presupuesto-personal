"use client";

import { useEffect, useMemo, useState } from "react";

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

  const saldoDisponible = useMemo(() => {
    if (!presupuesto) return 0;
    return Number(presupuesto.presupuestoTotal || 0) - Number(presupuesto.totalGastado || 0);
  }, [presupuesto]);

  useEffect(() => {
    cargarListaPresupuestos();
  }, []);

  useEffect(() => {
    if (presupuesto?.categorias?.length > 0 && !subcategoriaForm.categoriaId) {
      setSubcategoriaForm((prev) => ({
        ...prev,
        categoriaId: presupuesto.categorias[0]._id,
      }));
    }
  }, [presupuesto, subcategoriaForm.categoriaId]);

  function mostrarMensaje(tipo, texto) {
    setMensaje({ tipo, texto });
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

  function limpiarSubcategoriaForm() {
    setSubcategoriaForm({
      id: "",
      categoriaId: categorias[0]?._id || "",
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
      setXmlReporte("");
      setXmlVisible(false);
      setVista("app");
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setCargando(false);
    }
  }

  async function cargarXML() {
    try {
      if (!presupuestoSeleccionadoId) {
        throw new Error("Primero debes abrir o crear un presupuesto");
      }

      const response = await fetch(
        `/api/reportes/xml?presupuestoId=${presupuestoSeleccionadoId}`,
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
      setVista("app");
      setXmlReporte("");
      setXmlVisible(false);
      mostrarMensaje("ok", "Presupuesto creado correctamente");
      await cargarListaPresupuestos();
      limpiarCategoriaForm();
      limpiarSubcategoriaForm();
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
      const response = await fetch(
        esEdicion
          ? `/api/categorias/${categoriaForm.id}?presupuestoId=${presupuestoSeleccionadoId}`
          : `/api/categorias?presupuestoId=${presupuestoSeleccionadoId}`,
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

      const response = await fetch(
        `/api/categorias/${categoriaId}?presupuestoId=${presupuestoSeleccionadoId}`,
        {
          method: "DELETE",
        }
      );


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo eliminar la categoría");
      }

      setPresupuesto(data.data);
      mostrarMensaje("ok", "Categoría eliminada correctamente");
      limpiarCategoriaForm();
      limpiarSubcategoriaForm();
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

      const url = esEdicion
        ? `/api/categorias/${subcategoriaForm.categoriaId}/subcategorias/${subcategoriaForm.id}?presupuestoId=${presupuestoSeleccionadoId}`
        : `/api/categorias/${subcategoriaForm.categoriaId}/subcategorias?presupuestoId=${presupuestoSeleccionadoId}`;

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
      mostrarMensaje(
        "ok",
        esEdicion
          ? "Subcategoría actualizada correctamente"
          : "Subcategoría creada correctamente"
      );

      limpiarSubcategoriaForm();
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

      const response = await fetch(
        `/api/categorias/${categoriaId}/subcategorias/${subcategoriaId}?presupuestoId=${presupuestoSeleccionadoId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No se pudo eliminar la subcategoría");
      }

      setPresupuesto(data.data);
      mostrarMensaje("ok", "Subcategoría eliminada correctamente");
      limpiarSubcategoriaForm();
      setXmlReporte("");
      setXmlVisible(false);
    } catch (error) {
      mostrarMensaje("error", error.message);
    } finally {
      setGuardando(false);
    }
  }

  function cargarCategoriaParaEditar(categoria) {
    setCategoriaForm({
      id: categoria._id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cargarSubcategoriaParaEditar(categoria, subcategoria) {
    setSubcategoriaForm({
      id: subcategoria._id,
      categoriaId: categoria._id,
      nombre: subcategoria.nombre,
      valorGastado: subcategoria.valorGastado,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                  onClick={() => cargarPresupuesto(presupuestoSeleccionadoId)}
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

            <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
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

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
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
                        Reporte XML
                      </h2>
                      <p className="mt-1 text-sm text-white/65">
                        Visualización del árbol XML generado desde los datos del presupuesto.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={cargarXML}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                    >
                      Generar XML
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