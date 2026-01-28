'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
};

const SESSION_KEY = "scoreimob_session";

export default function NovoClientePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");
  const [cpf, setCpf] = useState("");
  const [rendaMensal, setRendaMensal] = useState("");
  const [valorImovel, setValorImovel] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [valorEntrada, setValorEntrada] = useState("");
  const [idade, setIdade] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !phone.trim() || !valorImovel.trim()) {
      setError("Preencha nome, e-mail, telefone e valor do imóvel.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          value: valorImovel.trim(),
          cpf: cpf.trim(),
          rendaMensal: rendaMensal.trim(),
          valorImovel: valorImovel.trim(),
          documentoUrl: documentoUrl.trim(),
          selfieUrl: selfieUrl.trim(),
          valorEntrada: valorEntrada.trim(),
          idade: idade ? Number(idade) : undefined,
          userId: user?.id,
          company: user?.company,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Erro ao salvar cliente.");
      }

      setSuccess("Cliente cadastrado com sucesso!");
      setName("");
      setEmail("");
      setPhone("");
      setValue("");
      setCpf("");
      setRendaMensal("");
      setValorImovel("");
      setDocumentoUrl("");
      setSelfieUrl("");
      setValorEntrada("");
      setIdade("");
      setTimeout(() => router.push("/analises"), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <div className="logo">S</div>
          <div>
            <h1>ScoreImob</h1>
            <p>Cadastrar novo cliente para análise.</p>
          </div>
        </div>
        <form className="auth__form" onSubmit={handleSubmit}>
          <h2>Novo cliente</h2>
          <label>
            <span>Nome completo</span>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Valor de entrada (opcional)</span>
            <input
              type="text"
              placeholder="Ex: R$ 80.000"
              value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)}
            />
          </label>
          <label>
            <span>Idade do cliente (opcional)</span>
            <input
              type="number"
              placeholder="Ex: 32"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              min={18}
              max={80}
            />
          </label>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Telefone</span>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Valor pretendido</span>
            <input
              type="text"
              placeholder="Ex: R$ 500.000"
              value={valorImovel}
              onChange={(e) => setValorImovel(e.target.value)}
              required
            />
          </label>
          <label>
            <span>CPF</span>
            <input
              type="text"
              placeholder="Somente números"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </label>
          <label>
            <span>Renda mensal</span>
            <input
              type="text"
              placeholder="Ex: R$ 12.000"
              value={rendaMensal}
              onChange={(e) => setRendaMensal(e.target.value)}
            />
          </label>
          <label>
            <span>Link do documento (RG/CNH)</span>
            <input
              type="url"
              placeholder="https://..."
              value={documentoUrl}
              onChange={(e) => setDocumentoUrl(e.target.value)}
            />
          </label>
          <label>
            <span>Link da selfie</span>
            <input
              type="url"
              placeholder="https://..."
              value={selfieUrl}
              onChange={(e) => setSelfieUrl(e.target.value)}
            />
          </label>
          {error ? <p className="auth__error">{error}</p> : null}
          {success ? <p className="auth__success">{success}</p> : null}
          <button className="solid" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar cliente"}
          </button>
          <p className="auth__hint">
            Voltar para o <Link href="/dashboard">dashboard</Link>
          </p>
          <p className="auth__hint">
            Ver <Link href="/analises">análises</Link>
          </p>
        </form>
      </div>
      <div className="auth__aside">
        <div className="aside__card">
          <h3>Próximo passo</h3>
          <p>Após salvar, consulte a análise em tempo real na aba Análises.</p>
        </div>
      </div>
    </div>
  );
}
