import { connectDB } from "../../../../../../lib/mongodb";
import Presupuesto from "../../../../../../models/Presupuesto";
import { calcularResumen } from "../../../../../../lib/presupuestoHelpers";

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const { categoriaId, subcategoriaId } = await params;
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

        const subcategoria = categoria.subcategorias.id(subcategoriaId);

        if (!subcategoria) {
            return Response.json(
                {
                    ok: false,
                    mensaje: "Subcategoría no encontrada",
                },
                { status: 404 }
            );
        }

        if (body.nombre !== undefined) {
            if (body.nombre.trim() === "") {
                return Response.json(
                    {
                        ok: false,
                        mensaje: "El nombre de la subcategoría no puede estar vacío",
                    },
                    { status: 400 }
                );
            }

            subcategoria.nombre = body.nombre;
        }

        if (body.valorGastado !== undefined) {
            const valorGastado = Number(body.valorGastado);

            if (Number.isNaN(valorGastado) || valorGastado < 0) {
                return Response.json(
                    {
                        ok: false,
                        mensaje: "El valor gastado debe ser un número mayor o igual a cero",
                    },
                    { status: 400 }
                );
            }

            subcategoria.valorGastado = valorGastado;
        }

        await presupuesto.save();

        return Response.json({
            ok: true,
            mensaje: "Subcategoría actualizada correctamente",
            data: calcularResumen(presupuesto),
        });
    } catch (error) {
        return Response.json(
            {
                ok: false,
                mensaje: "Error actualizando la subcategoría",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const { categoriaId, subcategoriaId } = await params;

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

        const subcategoria = categoria.subcategorias.id(subcategoriaId);

        if (!subcategoria) {
            return Response.json(
                {
                    ok: false,
                    mensaje: "Subcategoría no encontrada",
                },
                { status: 404 }
            );
        }

        subcategoria.deleteOne();

        await presupuesto.save();

        return Response.json({
            ok: true,
            mensaje: "Subcategoría eliminada correctamente",
            data: calcularResumen(presupuesto),
        });
    } catch (error) {
        return Response.json(
            {
                ok: false,
                mensaje: "Error eliminando la subcategoría",
                error: error.message,
            },
            { status: 500 }
        );
    }
}