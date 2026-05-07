import { connectDB } from "../../../../lib/mongodb";
import Presupuesto from "../../../../models/Presupuesto";
import { calcularResumen } from "../../../../lib/presupuestoHelpers";
import { generarXMLPresupuesto } from "../../../../lib/xmlGenerator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const presupuesto = await Presupuesto.findOne().sort({ createdAt: -1 });

    if (!presupuesto) {
      const xmlError = `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <mensaje>No hay presupuesto registrado todavía</mensaje>
</error>`;

      return new Response(xmlError, {
        status: 404,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    }

    const presupuestoConResumen = calcularResumen(presupuesto);
    const xml = generarXMLPresupuesto(presupuestoConResumen);

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    const xmlError = `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <mensaje>Error generando el reporte XML</mensaje>
  <detalle>${error.message}</detalle>
</error>`;

    return new Response(xmlError, {
      status: 500,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
}