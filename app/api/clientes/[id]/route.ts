import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { computeFinance } from "../../../../lib/computeFinance";

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const clientId = context.params.id;
    const url = new URL(_request.url);
    const userId = url.searchParams.get("userId")?.trim();

    if (!clientId || !userId) {
      return NextResponse.json({ message: "Cliente ou usuário não informado." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,nome,email,empresa,telefone,status,score,valor,criado_em,user_id,cpf,renda_mensal,valor_imovel,valor_entrada,idade,documento_url,selfie_url,status_doc,status_cpf,status_renda"
      )
      .eq("id", clientId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/clientes/:id] supabase select error:", error);
      return NextResponse.json({ message: "Erro ao buscar cliente.", details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: "Cliente não encontrado." }, { status: 404 });
    }

    const finance = computeFinance(data);

    return NextResponse.json({
      id: data.id,
      name: data.nome,
      email: data.email,
      company: data.empresa,
      phone: data.telefone,
      status: data.status || "Em revisão",
      score: data.score || "–",
      value: data.valor || data.valor_imovel || "A definir",
      cpf: data.cpf,
      rendaMensal: data.renda_mensal,
      valorImovel: data.valor_imovel,
      valorEntrada: data.valor_entrada,
      idade: data.idade,
      documentoUrl: data.documento_url,
      selfieUrl: data.selfie_url,
      statusDoc: data.status_doc || "Em revisão",
      statusCpf: data.status_cpf || "Em revisão",
      statusRenda: data.status_renda || "Em revisão",
      createdAt: data.criado_em,
      financiamento: finance,
    });
  } catch (error) {
    console.error("[/api/clientes/:id] unexpected error:", error);
    return NextResponse.json({ message: "Erro ao processar requisição." }, { status: 500 });
  }
}
