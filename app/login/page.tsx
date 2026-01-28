'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const SESSION_KEY = "scoreimob_session";

type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      router.replace("/dashboard");
      return;
    }

    // Se veio de uma sessão anterior no navegador, limpa o campo para evitar autofill.
    setUsername("");
    setPassword("");
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const normalizedUser = username.trim().toLowerCase();
    const normalizedPass = password.trim();

    if (!normalizedUser || !normalizedPass) {
      setError("Preencha usuário e senha.");
      setLoading(false);
      return;
    }

    const doLogin = async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: normalizedUser, password: normalizedPass }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Não foi possível entrar.");
        }

        const body = await res.json();
        const sessionUser: SessionUser = {
          id: body.user?.id,
          name: body.user?.name,
          email: body.user?.email,
          company: body.user?.company,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível entrar.");
        setLoading(false);
      }
    };

    void doLogin();
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <div className="logo">S</div>
          <div>
            <h1>ScoreImob</h1>
            <p>Segurança e clareza na análise de crédito.</p>
          </div>
        </div>
        <form className="auth__form" onSubmit={handleSubmit} autoComplete="off">
          <h2>Entrar</h2>
          <label>
            <span>Usuário</span>
            <input
              type="text"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
            />
          </label>
          <label>
            <span>Senha</span>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="off"
            />
          </label>
          <div className="auth__actions">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Lembrar de mim</span>
            </label>
            <a href="#">Esqueci minha senha</a>
          </div>
          {error ? <p className="auth__error">{error}</p> : null}
          <button className="solid" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="auth__hint">
            Não tem conta? <Link href="/signup">Criar conta</Link>
          </p>
          <p className="auth__hint">
            <Link href="/landing">Voltar para a landing</Link>
          </p>
        </form>
      </div>
      <div className="auth__aside">
        <div className="aside__card">
          <h3>Portal seguro</h3>
          <p>Autenticação protegida, controle de sessão e monitoramento antifraude.</p>
        </div>
        <div className="aside__metrics">
          <div>
            <span className="metric__label">Disponibilidade</span>
            <strong>99,9%</strong>
          </div>
          <div>
            <span className="metric__label">Tempo médio</span>
            <strong>8 min</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
