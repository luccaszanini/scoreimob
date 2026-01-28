'use client';

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
};

type Client = {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  status: string;
  score: string;
  value: string;
  createdAt?: string;
  cpf?: string;
  rendaMensal?: string;
  valorImovel?: string;
  valorEntrada?: string;
  idade?: number;
  documentoUrl?: string;
  selfieUrl?: string;
  statusDoc?: string;
  statusCpf?: string;
  statusRenda?: string;
  financiamento?: {
    faixa: string;
    subsidio: number;
    jurosAA: number;
    prazoAnos: number;
    entrada?: number;
    saldoFinanciado: number;
    parcela: number;
    limiteParcela: number;
    aprovado: boolean;
    aprovadoRenda: boolean;
    isElegivelValor: boolean;
    requiredExtraEntry: number;
    motivo: string;
    dica: string;
  } | null;
};

const SESSION_KEY = "scoreimob_session";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const parseNumber = (value?: string) => {
    if (!value) return 0;
    const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const calcFinancing = (data: Client) => {
    const renda = parseNumber(data.rendaMensal);
    const valorImovel = parseNumber(data.valorImovel || data.value);
    const entrada = parseNumber(data.valorEntrada);

    if (!renda || !valorImovel) {
      return null;
    }

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

    const idade = data.idade && data.idade > 0 ? data.idade : null;
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
      jurosAA,
      subsidio,
      entrada,
      renda,
      valorImovel,
      saldoFinanciado,
      limiteParcela,
      prazoAnos: maxAnos,
      parcela,
      aprovado,
      isElegivelValor,
    aprovadoRenda,
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
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SessionUser;
      if (!parsed?.id) {
        router.replace("/login");
        return;
      }
      setUser(parsed);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const fetchClient = useCallback(async () => {
    if (!user?.id || !params?.id) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/clientes/${params.id}?userId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Cliente não encontrado.");
      }
      const body = await res.json();
      setClient(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar cliente.");
    } finally {
      setLoading(false);
    }
  }, [params?.id, user?.id]);

  useEffect(() => {
    if (!user?.id || !params?.id) return;
    void fetchClient();
  }, [params?.id, user?.id, fetchClient]);

  if (!user) return null;
  const financing = client ? client.financiamento || calcFinancing(client) : null;

  return (
    <div className="app">
      <header className="app__topbar">
        <div className="app__brand">
          <div className="logo">S</div>
          <span>ScoreImob</span>
        </div>
        <nav className="app__nav">
          <Link href="/dashboard">Início</Link>
          <Link href="/clientes">Clientes</Link>
          <Link href="/analises">Análises</Link>
        </nav>
        <div className="app__user">
          <span className="user__name">{user.email || "convidado"}</span>
          <button className="ghost" type="button" onClick={() => router.push("/login")}>
            Sair
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="app__hero">
          <div>
            <p className="pill">Detalhe do cliente</p>
            <h1>{client?.name || "Cliente"}</h1>
            <p>{client?.email}</p>
          </div>
          <div className="app__actions">
            <Link className="ghost" href="/analises">
              Voltar para análises
            </Link>
            <button className="ghost" type="button" onClick={() => fetchClient()}>
              Recarregar dados
            </button>
            <Link className="solid" href="/dashboard">
              Painel
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="table">
            <div className="table__empty">Carregando cliente...</div>
          </div>
        ) : error ? (
          <div className="table">
            <p className="auth__error">{error}</p>
          </div>
        ) : client ? (
          <section className="grid grid--two">
            <div className="mini-card">
              <span className="mini-card__label">Nome</span>
              <strong>{client.name}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">E-mail</span>
              <strong>{client.email || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Telefone</span>
              <strong>{client.phone || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Status</span>
              <strong>{financing ? (financing.aprovado ? "Aprovado" : "Recusado") : client.status}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Score</span>
              <strong>{client.score}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">CPF</span>
              <strong>{client.cpf || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Renda mensal</span>
              <strong>{client.rendaMensal || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Valor do imóvel</span>
              <strong>{client.valorImovel || client.value || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Valor de entrada</span>
              <strong>{client.valorEntrada || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Idade</span>
              <strong>{client.idade || "-"}</strong>
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Documento</span>
              <strong>{client.documentoUrl ? "Enviado" : "Pendente"}</strong>
              {client.documentoUrl ? (
                <a className="ghost" href={client.documentoUrl} target="_blank" rel="noreferrer">
                  Ver documento
                </a>
              ) : null}
            </div>
            <div className="mini-card">
              <span className="mini-card__label">Selfie</span>
              <strong>{client.selfieUrl ? "Enviada" : "Pendente"}</strong>
              {client.selfieUrl ? (
                <a className="ghost" href={client.selfieUrl} target="_blank" rel="noreferrer">
                  Ver selfie
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {client ? (
          <section className="table">
            <div className="table__head">
              <h2>Checklist de verificação</h2>
            </div>
            <div className="grid grid--three">
              <div className="mini-card">
                <span className="mini-card__label">Documento</span>
                <strong>{client.statusDoc || "Em revisão"}</strong>
              </div>
              <div className="mini-card">
                <span className="mini-card__label">CPF</span>
                <strong>{client.statusCpf || "Em revisão"}</strong>
              </div>
              <div className="mini-card">
                <span className="mini-card__label">Renda</span>
                <strong>{client.statusRenda || "Em revisão"}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {client ? (
          financing ? (
            <section className="table">
              <div className="table__head">
                <h2>Capacidade de financiamento</h2>
              </div>
              <div className="grid grid--two">
                <div className="mini-card">
                  <span className="mini-card__label">Faixa</span>
                  <strong>{financing.faixa}</strong>
                  <span className="mini-card__label">Juros a.a.</span>
                  <strong>{financing.jurosAA.toFixed(2)}%</strong>
                  <span className="mini-card__label">Prazo sugerido</span>
                  <strong>{financing.prazoAnos} anos</strong>
                </div>
                <div className="mini-card">
                  <span className="mini-card__label">Saldo a financiar</span>
                  <strong>
                    R$ {financing.saldoFinanciado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="mini-card__label">Parcela estimada</span>
                  <strong>R$ {financing.parcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  <span className="mini-card__label">Limite (30% renda)</span>
                  <strong>R$ {financing.limiteParcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
              <div className="mini-list">
                <div className="mini-list__item">
                  <span>Subsídio estimado</span>
                  <span className="pill pill--soft">
                    R$ {financing.subsidio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mini-list__item">
                  <span>Entrada considerada</span>
                  <span>{financing.entrada ? `R$ ${financing.entrada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informada"}</span>
                </div>
                <div className="mini-list__item">
                  <span>Elegível pelo valor do imóvel</span>
                  <span className={financing.isElegivelValor ? "status status--ok" : "status status--alert"}>
                    {financing.isElegivelValor ? "Sim" : "Acima do teto"}
                  </span>
                </div>
              <div className="mini-list__item">
                <span>Capacidade financeira (30% renda)</span>
                <span className={financing.aprovadoRenda ? "status status--ok" : "status status--alert"}>
                  {financing.aprovadoRenda ? "Dentro do limite" : "Parcela acima do limite"}
                </span>
              </div>
              {!financing.aprovado ? (
                <div className="mini-list__item">
                  <span>Entrada necessária para aprovar</span>
                  <span>
                    {financing.requiredExtraEntry > 0
                      ? `R$ ${financing.requiredExtraEntry.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "Informe renda e valor do imóvel"}
                  </span>
                </div>
              ) : null}
              <div className="mini-list__item">
                <span>Motivo</span>
                <span>{financing.motivo}</span>
              </div>
              <div className="mini-list__item">
                <span>Recomendação</span>
                <span>{financing.dica || "Dentro do perfil"}</span>
              </div>
            </div>
            </section>
          ) : (
            <section className="table">
              <div className="table__head">
                <h2>Capacidade de financiamento</h2>
              </div>
              <div className="table__empty">Informe renda e valor do imóvel para calcular.</div>
            </section>
          )
        ) : null}
      </main>
    </div>
  );
}
