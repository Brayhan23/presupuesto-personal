import { connectDB } from "../../../../lib/mongodb";
import Presupuesto from "../../../../models/Presupuesto";
import { calcularResumen } from "../../../../lib/presupuestoHelpers";

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { categoriaId } = await params;
    const body = await request.json();

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
        },
        { status: 404 }
      );
    }

    const categoria = presupuesto.categorias.id(categoriaId);

    if (!categoria) {
      return Response.json(
        {
          ok: false,
          mensaje: "Categoría no encontrada",
        },
        { status: 404 }
      );
    }

    if (body.nombre !== undefined) {
      if (body.nombre.trim() === "") {
        return Response.json(
          {
            ok: false,
            mensaje: "El nombre de la categoría no puede estar vacío",
          },
          { status: 400 }
        );
      }

      categoria.nombre = body.nombre;
    }

    if (body.descripcion !== undefined) {
      categoria.descripcion = body.descripcion;
    }

    await presupuesto.save();

    return Response.json({
      ok: true,
      mensaje: "Categoría actualizada correctamente",
      data: calcularResumen(presupuesto),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error actualizando la categoría",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { categoriaId } = await params;

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
        },
        { status: 404 }
      );
    }

    const categoria = presupuesto.categorias.id(categoriaId);

    if (!categoria) {
      return Response.json(
        {
          ok: false,
          mensaje: "Categoría no encontrada",
        },
        { status: 404 }
      );
    }

    categoria.deleteOne();

    await presupuesto.save();

    return Response.json({
      ok: true,
      mensaje: "Categoría eliminada correctamente",
      data: calcularResumen(presupuesto),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error eliminando la categoría",
        error: error.message,
      },
      { status: 500 }
    );
  }
}