import { connectDB } from "../../../lib/mongodb";
import Presupuesto from "../../../models/Presupuesto";
import { categoriasBase } from "../../../lib/categoriasBase";
import { calcularResumen } from "../../../lib/presupuestoHelpers";

export const dynamic = "force-dynamic";

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
          data: null,
        },
        { status: 404 }
      );
    }

    const presupuestoConResumen = calcularResumen(presupuesto);

    return Response.json({
      ok: true,
      mensaje: "Presupuesto consultado correctamente",
      data: presupuestoConResumen,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error consultando el presupuesto",
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
          mensaje: "El nombre del presupuesto es obligatorio",
        },
        { status: 400 }
      );
    }

    const presupuestoTotal = Number(body.presupuestoTotal);

    if (Number.isNaN(presupuestoTotal) || presupuestoTotal <= 0) {
      return Response.json(
        {
          ok: false,
          mensaje: "El presupuesto total debe ser un número mayor a cero",
        },
        { status: 400 }
      );
    }

    const nuevoPresupuesto = await Presupuesto.create({
      nombre: body.nombre,
      presupuestoTotal,
      categorias:
        body.categorias && body.categorias.length > 0
          ? body.categorias
          : categoriasBase,
    });

    return Response.json(
      {
        ok: true,
        mensaje: "Presupuesto creado correctamente",
        data: calcularResumen(nuevoPresupuesto),
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error creando el presupuesto",
        error: error.message,
      },
      { status: 500 }
    );
  }
}