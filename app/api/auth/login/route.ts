import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { hashPassword } from "../../../../lib/password";

type LoginInput = {
  identifier?: string; // email ou nome
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginInput;
    const identifier = body.identifier?.trim().toLowerCase();
    const password = body.password?.trim() || "";

    if (!identifier || !password) {
      return NextResponse.json({ message: "Preencha usuário (e-mail) e senha." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nome,email,empresa,senha_hash")
      .or(`email.eq.${identifier},nome.eq.${identifier}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[POST /api/auth/login] supabase select error:", error);
      return NextResponse.json({ message: "Erro ao buscar usuário." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 401 });
    }

    const incomingHash = hashPassword(password);
    if (incomingHash !== data.senha_hash) {
      return NextResponse.json({ message: "Senha incorreta." }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.id,
        name: data.nome,
        email: data.email,
        company: data.empresa,
      },
    });
  } catch (error) {
    console.error("[/api/auth/login] unexpected error:", error);
    return NextResponse.json({ message: "Erro ao processar login." }, { status: 500 });
  }
}
