import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { hashPassword } from "../../../lib/password";

type UsuarioInput = {
  name?: string;
  email?: string;
  company?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UsuarioInput;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const company = body.company?.trim();
    const password = body.password?.trim();
    const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("usuarios").insert({
      nome: name,
      email,
      empresa: company || null,
      senha_hash: hashPassword(password),
      criado_em: createdAt,
    });

    if (error) {
      console.error("[POST /api/usuarios] supabase insert error:", error);
      return NextResponse.json({ message: "Erro ao salvar usuário.", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[/api/usuarios] unexpected error:", error);
    return NextResponse.json({ message: "Erro ao processar requisição." }, { status: 500 });
  }
}
