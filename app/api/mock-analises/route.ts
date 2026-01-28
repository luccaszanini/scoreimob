import { NextResponse } from "next/server";

export async function GET() {
  const data = [
    { name: "Cliente Demo", status: "Em revisão", score: "–", value: "A definir", updatedAt: new Date().toISOString() },
    { name: "Helena Souza", status: "Aprovado", score: "8.8", value: "R$ 720k", updatedAt: new Date().toISOString() },
    { name: "Marcelo Nunes", status: "Recusado", score: "4.1", value: "R$ 310k", updatedAt: new Date().toISOString() },
  ];

  return NextResponse.json({ items: data });
}
