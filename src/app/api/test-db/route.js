

import { connectDB } from "../../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return Response.json({
      ok: true,
      mensaje: "Conexión exitosa con MongoDB Atlas",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "Error conectando con MongoDB",
        error: error.message,
      },
      { status: 500 }
    );
  }
}