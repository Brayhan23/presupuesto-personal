import "./globals.css";

export const metadata = {
  title: "Presupuesto Personal",
  description: "CRUD de presupuesto personal con reporte XML",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}