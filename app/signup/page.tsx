'use client';

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  email: string;
  password: string;
  company: string;
};

const minPasswordLength = 8;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", company: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return "Preencha nome, e-mail e senha.";
    }
    if (!form.email.includes("@")) {
      return "Informe um e-mail válido.";
    }
    if (form.password.length < minPasswordLength) {
      return `Senha deve ter pelo menos ${minPasswordLength} caracteres.`;
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          company: form.company.trim(),
          password: form.password,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erro ao salvar usuário.");
      }

      setSuccess("Imobiliária cadastrada! Faça login para acessar o painel.");
      setForm({ name: "", email: "", password: "", company: "" });
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
        <form className="auth__form" onSubmit={handleSubmit}>
          <h2>Criar conta</h2>
          <label>
            <span>Nome completo</span>
            <input
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => handleChange("name")(e.target.value)}
              required
            />
          </label>
          <label>
            <span>E-mail corporativo</span>
            <input
              type="email"
              placeholder="voce@empresa.com"
              value={form.email}
              onChange={(e) => handleChange("email")(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            <span>Senha</span>
            <input
              type="password"
              placeholder={`Mínimo ${minPasswordLength} caracteres`}
              value={form.password}
              onChange={(e) => handleChange("password")(e.target.value)}
              required
              minLength={minPasswordLength}
              autoComplete="new-password"
            />
          </label>
          <label>
            <span>Empresa</span>
            <input
              type="text"
              placeholder="Nome da imobiliária/construtora"
              value={form.company}
              onChange={(e) => handleChange("company")(e.target.value)}
            />
          </label>
          {error ? <p className="auth__error">{error}</p> : null}
          {success ? <p className="auth__success">{success}</p> : null}
          <button className="solid" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar conta"}
          </button>
          <p className="auth__hint">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
          <p className="auth__hint">
            <Link href="/landing">Voltar para a landing</Link>
          </p>
        </form>
      </div>
      <div className="auth__aside">
        <div className="aside__card">
          <h3>Comece em minutos</h3>
          <p>Cadastre seu time, habilite permissões e personalize os critérios de score.</p>
        </div>
        <div className="aside__metrics">
          <div>
            <span className="metric__label">Onboarding</span>
            <strong>&lt; 10 min</strong>
          </div>
          <div>
            <span className="metric__label">Times ativos</span>
            <strong>200+</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
