
import { connectDB } from "../../../lib/mongodb";
import Presupuesto from "../../../models/Presupuesto";
import { calcularResumen } from "../../../lib/presupuestoHelpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const presupuestos = await Presupuesto.find().sort({ createdAt: -1 });

    const presupuestosConResumen = presupuestos.map((presupuesto) => {
      const resumen = calcularResumen(presupuesto);

      return {
        _id: resumen._id,
        nombre: resumen.nombre,
        presupuestoTotal: resumen.presupuestoTotal,
        totalGastado: resumen.totalGastado,
        porcentajeGastado: resumen.porcentajeGastado,
        createdAt: resumen.createdAt,
      };
    });

    return Response.json({
      ok: true,
      mensaje: "Presupuestos consultados correctamente",
      data: presupuestosConResumen,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error consultando los presupuestos",
        error: error.message,
      },
      { status: 500 }
    );
  }
}