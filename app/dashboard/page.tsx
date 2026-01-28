'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Notifications, NotificationItem } from "../components/Notifications";

type Row = {
  id?: string;
  name: string;
  status: string;
  score: string;
  value: string;
  time: string;
};

type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
};

const seedRows: Row[] = [
  { name: "Mariana Costa", status: "Aprovado", score: "8.9", value: "R$ 650k", time: "Há 5 min" },
  { name: "Lucas Pereira", status: "Revisar", score: "6.4", value: "R$ 420k", time: "Há 12 min" },
  { name: "Ana Lima", status: "Aprovado", score: "9.1", value: "R$ 880k", time: "Há 20 min" },
  { name: "João Silva", status: "Recusado", score: "4.2", value: "R$ 300k", time: "Há 26 min" },
];

const SESSION_KEY = "scoreimob_session";

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [rows, setRows] = useState<Row[]>(seedRows);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          value: item.valorImovel || item.value || "A definir",
          time: item.createdAt ? formatTime(item.createdAt) : "Agora",
          financiamento: item.financiamento,
        }));
        setRows(mapped.length ? mapped : seedRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar clientes.");
        setRows(seedRows);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRows();
    }
  }, [user?.id]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/login");
  };

  if (!isReady) {
    return null;
  }

  const displayName = user?.name || user?.company || user?.email || "convidado";
  const statusCounts = rows.reduce(
    (acc, row) => {
      if (row.status === "Aprovado") acc.aprovado += 1;
      else if (row.status === "Em revisão" || row.status === "Revisar") acc.revisar += 1;
      else acc.recusado += 1;
      return acc;
    },
    { aprovado: 0, revisar: 0, recusado: 0 }
  );
  const totalCount = Math.max(rows.length, 1);
  const notifications: NotificationItem[] = rows
    .filter((row) => row.id && (row.status === "Aprovado" || row.status === "Recusado"))
    .map((row) => ({
      id: row.id as string,
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
          <Link className="active" href="#">
            Início
          </Link>
          <Link href="/clientes">Clientes</Link>
          <Link href="/analises">Análises</Link>
        </nav>
        <div className="app__user">
          <span className="user__name">Olá, {displayName}</span>
          {user?.email ? <span className="user__name">{user.email}</span> : null}
          <Notifications items={notifications} />
          <button className="ghost" type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="app__hero">
          <div>
            <p className="pill">Painel</p>
            <h1>Suas análises de crédito em um lugar.</h1>
            <p>Resumo rápido das solicitações, risco e documentos.</p>
          </div>
          <div className="app__actions">
            <Link className="solid" href="/clientes/novo">
              Cadastrar novo cliente
            </Link>
          </div>
        </section>

        <section className="grid grid--three app__metrics">
          <div className="mini-card">
            <span className="mini-card__label">Solicitações hoje</span>
            <strong>24</strong>
            <span className="pill pill--soft">+12% vs ontem</span>
          </div>
          <div className="mini-card">
            <span className="mini-card__label">Aprovadas</span>
            <strong>18</strong>
            <span className="pill pill--soft">75% taxa</span>
          </div>
          <div className="mini-card">
            <span className="mini-card__label">Tempo médio</span>
            <strong>08 min</strong>
            <span className="pill pill--soft">Meta &lt; 10 min</span>
          </div>
        </section>

        <section className="table">
          <div className="table__head">
            <h2>Status das análises</h2>
            <span className="table__meta">Distribuição visual</span>
          </div>
          <div className="status-cards">
            {[
              { label: "Aprovado", value: statusCounts.aprovado, color: "#22c55e" },
              { label: "Em revisão", value: statusCounts.revisar, color: "#eab308" },
              { label: "Recusado", value: statusCounts.recusado, color: "#ef4444" },
            ].map((item) => {
              const pct = Math.round((item.value / totalCount) * 100);
              return (
                <div className="status-card" key={item.label}>
                  <div className="status-card__head">
                    <span className="status-card__label">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="status-card__bar">
                    <div className="status-card__bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                  <span className="status-card__pct">{pct}%</span>
                </div>
              );
            })}
          </div>
          {error ? <p className="auth__error">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
