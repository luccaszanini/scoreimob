type FinanceInput = {
  renda_mensal?: string | null;
  valor_imovel?: string | null;
  valor?: string | null;
  valor_entrada?: string | null;
  idade?: number | null;
};

function toNumber(value?: string | null) {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function computeFinance(item: FinanceInput) {
  const renda = toNumber(item.renda_mensal);
  const valorImovel = toNumber(item.valor_imovel || item.valor);
  const entrada = toNumber(item.valor_entrada);

  if (!renda || !valorImovel) return null;

  const tiers = [
    { label: "Faixa 1", rendaMax: 2850, limitImovel: 275000, jurosAA: 4.25, subsidio: 65000 },
    { label: "Faixa 2", rendaMax: 4700, limitImovel: 275000, jurosAA: 4.5, subsidio: 65000 },
    { label: "Faixa 3", rendaMax: 8600, limitImovel: 350000, jurosAA: 8, subsidio: 0 },
    { label: "Faixa 4", rendaMax: 12000, limitImovel: 500000, jurosAA: 10.5, subsidio: 0 },
  ];

  let faixa = "Não compatível com MCMV";
  let subsidio = 0;
  let jurosAA = 12;
  let limiteImovel = Infinity;

  for (const tier of tiers) {
    if (renda <= tier.rendaMax && valorImovel <= tier.limitImovel) {
      faixa = tier.label;
      subsidio = tier.subsidio;
      jurosAA = tier.jurosAA;
      limiteImovel = tier.limitImovel;
      break;
    }
  }

  const isElegivelValor = valorImovel <= limiteImovel;
  const saldoFinanciado = Math.max(0, valorImovel - subsidio - entrada);
  const limiteParcela = renda * 0.3;

  const idade = item.idade && item.idade > 0 ? item.idade : null;
  const maxAnos = idade ? Math.max(5, Math.min(35, 75 - idade)) : 35;
  const meses = maxAnos * 12;
  const jurosMes = jurosAA / 12 / 100;

  const parcela =
    jurosMes > 0 ? (saldoFinanciado * jurosMes) / (1 - Math.pow(1 + jurosMes, -meses)) : saldoFinanciado / meses;
  const financeableAmount =
    jurosMes > 0 ? (limiteParcela * (1 - Math.pow(1 + jurosMes, -meses))) / jurosMes : limiteParcela * meses;
  const requiredExtraEntry = Math.max(0, saldoFinanciado - financeableAmount);

  const aprovadoRenda = parcela <= limiteParcela;
  const aprovado = aprovadoRenda && isElegivelValor;

  return {
    faixa,
    subsidio,
    jurosAA,
    prazoAnos: maxAnos,
    entrada,
    saldoFinanciado,
    parcela,
    limiteParcela,
    aprovado,
    aprovadoRenda,
    isElegivelValor,
    requiredExtraEntry,
    motivo: aprovado
      ? "Dentro dos limites"
      : !isElegivelValor
        ? "Valor do imóvel acima do teto da faixa"
        : "Parcela estimada acima de 30% da renda",
    dica: aprovado
      ? "Dentro do perfil"
      : !isElegivelValor
        ? "Considere um imóvel dentro do teto da faixa ou renegocie o valor."
        : requiredExtraEntry > 0
          ? `Aumente a entrada em ~R$ ${requiredExtraEntry.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para caber no limite.`
          : "Revise renda/valor para caber em 30%.",
  };
}
