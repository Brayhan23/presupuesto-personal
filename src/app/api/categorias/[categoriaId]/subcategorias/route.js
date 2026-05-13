import { connectDB } from "../../../../../lib/mongodb";
import Presupuesto from "../../../../../models/Presupuesto";
import { calcularResumen } from "../../../../../lib/presupuestoHelpers";

export async function GET(request, { params }) {
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
                    data: [],
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
                    data: [],
                },
                { status: 404 }
            );
        }

        return Response.json({
            ok: true,
            mensaje: "Subcategorías consultadas correctamente",
            data: categoria.subcategorias,
        });
    } catch (error) {
        return Response.json(
            {
                ok: false,
                mensaje: "Error consultando las subcategorías",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        await connectDB();

        const { categoriaId } = await params;
        const body = await request.json();

        if (!body.nombre || body.nombre.trim() === "") {
            return Response.json(
                {
                    ok: false,
                    mensaje: "El nombre de la subcategoría es obligatorio",
                },
                { status: 400 }
            );
        }

        if (body.valorGastado === undefined || body.valorGastado === null) {
            return Response.json(
                {
                    ok: false,
                    mensaje: "El valor gastado es obligatorio",
                },
                { status: 400 }
            );
        }

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

        const { searchParams } = new URL(request.url);
        const presupuestoId = searchParams.get("presupuestoId");

        if (!presupuestoId) {
            return Response.json(
                {
                    ok: false,
                    mensaje: "El presupuestoId es obligatorio",
                },
                { status: 400 }
            );
        }

        const presupuesto = await Presupuesto.findById(presupuestoId);

        if (!presupuesto) {
            return Response.json(
                {
                    ok: false,
                    mensaje: "Presupuesto no encontrado",
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

        categoria.subcategorias.push({
            nombre: body.nombre,
            valorGastado,
        });

        await presupuesto.save();

        return Response.json(
            {
                ok: true,
                mensaje: "Subcategoría creada correctamente",
                data: calcularResumen(presupuesto),
            },
            { status: 201 }
        );
    } catch (error) {
        return Response.json(
            {
                ok: false,
                mensaje: "Error creando la subcategoría",
                error: error.message,
            },
            { status: 500 }
        );
    }
}