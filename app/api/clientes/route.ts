import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { computeFinance } from "../../../lib/computeFinance";

type ClienteInput = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  userId?: string;
  value?: string;
  cpf?: string;
  rendaMensal?: string;
  valorImovel?: string;
  documentoUrl?: string;
  selfieUrl?: string;
  valorEntrada?: string;
  idade?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClienteInput;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const company = body.company?.trim();
    const phone = body.phone?.trim();
    const userId = body.userId?.trim();
    const value = body.value?.trim();
    const cpf = body.cpf?.replace(/[^\d]/g, "") || null;
    const rendaMensal = body.rendaMensal?.trim() || null;
    const valorImovel = body.valorImovel?.trim() || null;
    const documentoUrl = body.documentoUrl?.trim() || null;
    const selfieUrl = body.selfieUrl?.trim() || null;
    const valorEntrada = body.valorEntrada?.trim() || null;
    const idade = typeof body.idade === "number" ? body.idade : null;
    // Força criação na timezone -3 (America/Sao_Paulo) para refletir horário local
    const createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    if (!name || !email || !phone || !userId) {
      return NextResponse.json({ message: "Nome, e-mail, telefone e usuário são obrigatórios." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("clientes").insert({
      nome: name,
      email,
      empresa: company || null,
      telefone: phone,
      cpf,
      renda_mensal: rendaMensal,
      valor_imovel: valorImovel || value || null,
      documento_url: documentoUrl,
      selfie_url: selfieUrl,
      valor_entrada: valorEntrada,
      idade,
      status_doc: "Em revisão",
      status_cpf: "Em revisão",
      status_renda: "Em revisão",
      status: "Em revisão",
      score: null,
      valor: valorImovel || value || null,
      user_id: userId,
      criado_em: createdAt,
    });

    if (error) {
      console.error("[POST /api/clientes] supabase insert error:", error);
      return NextResponse.json({ message: "Erro ao salvar no Supabase.", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro ao processar requisição." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim();
    if (!userId) {
      return NextResponse.json({ message: "Usuário não informado." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,nome,email,empresa,telefone,cpf,renda_mensal,valor_imovel,valor_entrada,idade,documento_url,selfie_url,status_doc,status_cpf,status_renda,status,score,valor,criado_em,user_id"
      )
      .eq("user_id", userId)
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[GET /api/clientes] supabase select error:", error);
      return NextResponse.json({ message: "Erro ao buscar clientes.", details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: (data || []).map((item) => {
        const finance = computeFinance(item);
        return {
          id: item.id,
          name: item.nome,
          email: item.email,
          company: item.empresa,
          phone: item.telefone,
          status: item.status || "Em revisão",
          statusDoc: item.status_doc || "Em revisão",
          statusCpf: item.status_cpf || "Em revisão",
          statusRenda: item.status_renda || "Em revisão",
          score: item.score || "–",
          value: item.valor || item.valor_imovel || "A definir",
          cpf: item.cpf,
          rendaMensal: item.renda_mensal,
          valorImovel: item.valor_imovel,
          valorEntrada: item.valor_entrada,
          idade: item.idade,
          documentoUrl: item.documento_url,
          selfieUrl: item.selfie_url,
          createdAt: item.criado_em,
          financiamento: finance,
        };
      }),
    });
  } catch (error) {
    console.error("[/api/clientes] unexpected error:", error);
    return NextResponse.json({ message: "Erro ao processar requisição." }, { status: 500 });
  }
}
