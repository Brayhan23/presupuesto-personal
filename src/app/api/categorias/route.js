import { connectDB } from "../../../lib/mongodb";
import Presupuesto from "../../../models/Presupuesto";
import { calcularResumen } from "../../../lib/presupuestoHelpers";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const presupuestoId = searchParams.get("presupuestoId");

    const presupuesto = presupuestoId
      ? await Presupuesto.findById(presupuestoId)
      : await Presupuesto.findOne().sort({ createdAt: -1 });

    if (!presupuesto) {
      return Response.json(
        {
          ok: false,
          mensaje: "No hay presupuesto registrado todavía",
          data: [],
        },
        { status: 404 }
      );
    }

    const presupuestoConResumen = calcularResumen(presupuesto);

    return Response.json({
      ok: true,
      mensaje: "Categorías consultadas correctamente",
      data: presupuestoConResumen.categorias,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error consultando las categorías",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.nombre || body.nombre.trim() === "") {
      return Response.json(
        {
          ok: false,
          mensaje: "El nombre de la categoría es obligatorio",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const presupuestoId = searchParams.get("presupuestoId");

    const presupuesto = presupuestoId
      ? await Presupuesto.findById(presupuestoId)
      : await Presupuesto.findOne().sort({ createdAt: -1 });

    if (!presupuesto) {
      return Response.json(
        {
          ok: false,
          mensaje: "Primero debes crear un presupuesto base",
        },
        { status: 404 }
      );
    }
    const categoriaExiste = presupuesto.categorias.some(
      (categoria) =>
        categoria.nombre.trim().toLowerCase() === body.nombre.trim().toLowerCase()
    );

    if (categoriaExiste) {
      return Response.json(
        {
          ok: false,
          mensaje: "Esta categoría ya existe en el presupuesto",
        },
        { status: 400 }
      );
    }

    presupuesto.categorias.push({
      nombre: body.nombre,
      descripcion: body.descripcion || "",
      subcategorias: [],
    });

    await presupuesto.save();

    return Response.json(
      {
        ok: true,
        mensaje: "Categoría creada correctamente",
        data: calcularResumen(presupuesto),
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error creando la categoría",
        error: error.message,
      },
      { status: 500 }
    );
  }
}