import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoreImob — Análise de crédito imobiliário",
  description: "Segurança e clareza para aprovar clientes na compra de imóveis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
