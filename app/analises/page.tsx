'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Notifications, NotificationItem } from "../components/Notifications";

type Row = {
  id: string;
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

export default function AnalisesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
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
          <Link href="/clientes">Clientes</Link>
          <Link className="active" href="/analises">
            Análises
          </Link>
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
        <section className="table">
          <div className="table__head">
            <h2>Últimas análises</h2>
            <Link href="/dashboard" className="ghost">
              Voltar ao painel
            </Link>
          </div>
          <div className="table__grid">
            <div className="table__row table__row--head">
              <span>Cliente</span>
              <span>Status</span>
              <span>Score</span>
              <span>Valor do imóvel</span>
              <span>Atualizado</span>
            </div>
            {loading ? (
              <div className="table__empty">Carregando análises...</div>
            ) : rows.length === 0 ? (
              <div className="table__empty">Nenhum cliente cadastrado ainda.</div>
            ) : (
              rows.map((row) => (
                <Link className="table__row" href={`/clientes/${row.id}`} key={row.id}>
                  <span>{row.name}</span>
                  <span className={statusClass(row.status)}>{row.status}</span>
                  <span>{row.score}</span>
                  <span>{row.value}</span>
                  <span>{row.time}</span>
                </Link>
              ))
            )}
          </div>
          {error ? <p className="auth__error">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
