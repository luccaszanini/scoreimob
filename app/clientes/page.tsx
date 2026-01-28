'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Notifications, NotificationItem } from "../components/Notifications";

type Row = {
  id: string;
  name: string;
  status: string;
  score: string;
  value: string;
  time: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rendaMensal?: string;
  valorImovel?: string;
  valorEntrada?: string;
  idade?: number;
  financiamento?: {
    aprovado: boolean;
    aprovadoRenda: boolean;
    limiteParcela: number;
    parcela: number;
    requiredExtraEntry: number;
  } | null;
};

type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
};

function statusClass(status: string) {
  if (status === "Em revisão") return "status status--warn";
  if (status === "Aprovado") return "status status--ok";
  if (status === "Revisar") return "status status--warn";
  return "status status--alert";
}

function formatTime(iso: string) {
  const created = new Date(iso);
  const diffMinutes = Math.floor((Date.now() - created.getTime()) / 60000);
  if (diffMinutes <= 1) return "Há instantes";
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays}d`;
}

const SESSION_KEY = "scoreimob_session";

function parseNumber(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calcFinancing(row: Row) {
  const renda = parseNumber(row.rendaMensal);
  const valorImovel = parseNumber(row.valorImovel || row.value);
  const entrada = parseNumber(row.valorEntrada);

  if (!renda || !valorImovel) return null;

  let faixa = "Mercado";
  let subsidio = 0;
  let jurosAA = 12;
  let limiteImovel = Infinity;

  if (renda <= 2850) {
    faixa = "Faixa 1";
    subsidio = valorImovel <= 275000 ? 65000 : 0;
    jurosAA = 4.25;
    limiteImovel = 275000;
  } else if (renda <= 4700) {
    faixa = "Faixa 2";
    subsidio = valorImovel <= 275000 ? 65000 : 0;
    jurosAA = 4.5;
    limiteImovel = 275000;
  } else if (renda <= 8600) {
    faixa = "Faixa 3";
    subsidio = 0;
    jurosAA = 8.5;
    limiteImovel = 350000;
  } else if (renda <= 12000) {
    faixa = "Faixa 4";
    subsidio = 0;
    jurosAA = 10.5;
    limiteImovel = 500000;
  }

  const isElegivelValor = valorImovel <= limiteImovel;
  const saldoFinanciado = Math.max(0, valorImovel - subsidio - entrada);
  const limiteParcela = renda * 0.3;

  const idade = row.idade && row.idade > 0 ? row.idade : null;
  const maxAnos = idade ? Math.max(5, Math.min(35, 75 - idade)) : 35;
  const meses = maxAnos * 12;
  const jurosMes = jurosAA / 12 / 100;
  const parcela =
    jurosMes > 0 ? (saldoFinanciado * jurosMes) / (1 - Math.pow(1 + jurosMes, -meses)) : saldoFinanciado / meses;

  const aprovado = parcela <= limiteParcela && isElegivelValor;
  const motivo = aprovado
    ? "Dentro dos limites"
    : !isElegivelValor
      ? "Valor do imóvel acima do teto da faixa"
      : "Parcela estimada acima de 30% da renda";

  const dica = !aprovado
    ? !isElegivelValor
      ? "Tente um imóvel com valor menor ou verifique a faixa."
      : "Aumente a entrada ou considere um valor menor para reduzir a parcela."
    : "";

  return {
    faixa,
    subsidio,
    jurosAA,
    prazoAnos: maxAnos,
    parcela,
    limiteParcela,
    aprovado,
    motivo,
    dica,
  };
}

export default function ClientesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tudo");

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
      setIsReady(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/clientes?userId=${encodeURIComponent(user?.id || "")}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Não foi possível carregar clientes.");
        }
        const body = await res.json();
        const mapped = (body.items || []).map((item: any) => ({
          id: item.id,
          name: item.name || "Lead",
          status: item.financiamento?.aprovado
            ? "Aprovado"
            : item.financiamento
              ? "Recusado"
              : item.status || "Em revisão",
          score: item.score || "–",
          value: item.value || "A definir",
          time: item.createdAt ? formatTime(item.createdAt) : "Agora",
          email: item.email,
          phone: item.phone,
          cpf: item.cpf,
          rendaMensal: item.rendaMensal,
          valorImovel: item.valorImovel,
          valorEntrada: item.valorEntrada,
          idade: item.idade,
          financiamento: item.financiamento,
        }));
        setRows(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar clientes.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRows();
    }
  }, [user?.id]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name.toLowerCase().includes(term) ||
        (row.email || "").toLowerCase().includes(term) ||
        (row.phone || "").toLowerCase().includes(term) ||
        (row.cpf || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "tudo" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  if (!isReady) return null;

  const notifications: NotificationItem[] = rows
    .filter((row) => row.id && (row.status === "Aprovado" || row.status === "Recusado"))
    .map((row) => ({
      id: row.id,
      title: row.name,
      status: row.status === "Aprovado" ? "Aprovado" : "Recusado",
      href: `/clientes/${row.id}`,
    }));

  return (
    <div className="app">
      <header className="app__topbar">
        <div className="app__brand">
          <div className="logo">S</div>
          <span>ScoreImob</span>
        </div>
        <nav className="app__nav">
          <Link href="/dashboard">Início</Link>
          <Link className="active" href="/clientes">
            Clientes
          </Link>
          <Link href="/analises">Análises</Link>
        </nav>
        <div className="app__user">
          <span className="user__name">{user?.email || "convidado"}</span>
          <Notifications items={notifications} />
          <button className="ghost" type="button" onClick={() => router.push("/login")}>
            Sair
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="app__hero">
          <div>
            <p className="pill">Clientes</p>
            <h1>Todos os clientes cadastrados.</h1>
            <p>Filtre por status ou procure por nome, e-mail ou telefone.</p>
          </div>
          <div className="app__actions">
            <Link className="solid" href="/clientes/novo">
              Cadastrar novo cliente
            </Link>
          </div>
        </section>

        <section className="table">
          <div className="table__head">
            <h2>Filtros</h2>
          </div>
          <div className="grid grid--three">
            <label className="mini-card" style={{ alignItems: "flex-start", gap: "0.35rem" }}>
              <span className="mini-card__label">Buscar</span>
              <input
                type="text"
                placeholder="Nome, e-mail ou telefone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="mini-card" style={{ alignItems: "flex-start", gap: "0.35rem" }}>
              <span className="mini-card__label">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="tudo">Todos</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Em revisão">Em revisão</option>
                <option value="Revisar">Revisar</option>
                <option value="Recusado">Recusado</option>
              </select>
            </label>
            <div className="mini-card" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button className="ghost" type="button" onClick={() => {
                setSearch("");
                setStatusFilter("tudo");
              }}>
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="table">
          <div className="table__head">
            <h2>Clientes</h2>
            <Link href="/analises" className="ghost">
              Ver análises
            </Link>
          </div>
          <div className="table__grid">
            <div className="table__row table__row--head" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}>
              <span>Cliente</span>
              <span>Status</span>
              <span>Valor do imóvel</span>
              <span>Aprovação</span>
            </div>
            {loading ? (
              <div className="table__empty">Carregando clientes...</div>
            ) : filteredRows.length === 0 ? (
              <div className="table__empty">Nenhum cliente encontrado com estes filtros.</div>
            ) : (
              filteredRows.map((row) => {
                const financing = row.financiamento || calcFinancing(row);
                const derivedStatus = financing ? (financing.aprovado ? "Aprovado" : "Recusado") : row.status;
                return (
                  <Link
                    className="table__row"
                    style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}
                    href={`/clientes/${row.id}`}
                    key={row.id}
                  >
                    <span>{row.name}</span>
                    <span className={statusClass(derivedStatus)}>{derivedStatus}</span>
                    <span>{row.valorImovel || row.value}</span>
                    <span className={financing?.aprovado ? "status status--ok" : "status status--alert"}>
                      {financing?.aprovado ? "Aprovado" : financing ? "Recusado" : "Sem dados"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          {error ? <p className="auth__error">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
